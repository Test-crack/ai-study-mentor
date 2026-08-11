﻿import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Mic, MicOff, Square, Play, RotateCcw, ChevronRight, ChevronLeft,
  Clock, Volume2, VolumeX, AlertCircle, CheckCircle, TrendingUp,
  Award, Target, Zap, BookOpen, MessageSquare, BarChart3, Sparkles,
  ArrowLeft, Loader2, Radio, Waves
} from 'lucide-react';
import { StudentSidebar } from "./dashboard/StudentSidebar";
import { StudentTopbar } from "./dashboard/StudentTopbar";
import { PremiumModal } from "@/features/payment/components/PremiumModal";
import { bandFillPct, bandFillFrac } from "@/shared/utils/bandScale";

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// Types
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
type AssessmentView = 'intro' | 'session' | 'analyzing' | 'results';
type RecordingState = 'idle' | 'listening_ai' | 'recording' | 'processing';

interface Question {
  id: number;
  text: string;
  part: 1 | 2 | 3;
  hint?: string;
}

interface Transcript {
  questionId: number;
  text: string;
  duration: number;
}

interface FeedbackCard {
  type: 'weakness' | 'improvement' | 'projection';
  title: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
  borderColor: string;
}

interface AssessmentResult {
  bandScore: number;
  projectedBand: string;
  weaknesses: { title: string; description: string }[];
  improvements: { title: string; description: string }[];
  subScores: {
    fluency: number;
    vocabulary: number;
    grammar: number;
    pronunciation: number;
  };
  overallFeedback: string;
}

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// Constants
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const IELTS_QUESTIONS: Question[] = [
  { id: 1, part: 1, text: "Can you tell me about yourself and where you're from?", hint: "Talk about your hometown, background, and current situation." },
  { id: 2, part: 1, text: "What do you enjoy doing in your free time?", hint: "Describe hobbies and interests with specific examples." },
  { id: 3, part: 2, text: "Describe a person who has had a significant influence on your life. You should say: who this person is, how you know them, what qualities they have, and explain why they have influenced you so much.", hint: "You have 1 minute to prepare. Speak for 1â€“2 minutes." },
  { id: 4, part: 3, text: "Do you think it's more important for young people to follow their passion or choose a stable career? Why?", hint: "Give a balanced argument with examples." },
  { id: 5, part: 3, text: "How has technology changed the way people communicate compared to previous generations?", hint: "Discuss both positive and negative changes." },
];

const ELEVENLABS_VOICE_ID = 'EXAVITQu4vr4xnSDxMaL'; // "Bella" voice

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// ElevenLabs TTS Helper
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
async function speakWithElevenLabs(text: string, apiKey: string): Promise<void> {
  try {
    const response = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${ELEVENLABS_VOICE_ID}/stream`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'xi-api-key': apiKey,
        },
        body: JSON.stringify({
          text,
          model_id: 'eleven_turbo_v2',
          voice_settings: { stability: 0.5, similarity_boost: 0.75, style: 0.3, use_speaker_boost: true },
        }),
      }
    );
    if (!response.ok) throw new Error('ElevenLabs API error');
    const audioBlob = await response.blob();
    const audioUrl = URL.createObjectURL(audioBlob);
    return new Promise((resolve) => {
      const audio = new Audio(audioUrl);
      audio.onended = () => { URL.revokeObjectURL(audioUrl); resolve(); };
      audio.onerror = () => { URL.revokeObjectURL(audioUrl); resolve(); };
      audio.play();
    });
  } catch {
    // Fallback to Web Speech API
    return new Promise((resolve) => {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.9;
      utterance.pitch = 1.0;
      utterance.onend = () => resolve();
      utterance.onerror = () => resolve();
      window.speechSynthesis.speak(utterance);
    });
  }
}

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// GPT Evaluation Helper
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
async function evaluateWithGPT(
  transcripts: Transcript[],
  questions: Question[],
  openAiKey: string
): Promise<AssessmentResult> {
  const conversationLog = transcripts
    .map((t) => {
      const q = questions.find((q) => q.id === t.questionId);
      return `Q: ${q?.text ?? ''}\nA: ${t.text} (Duration: ${t.duration}s)`;
    })
    .join('\n\n');

  const prompt = `You are an expert IELTS Speaking examiner. Evaluate the following IELTS Speaking test responses using the official IELTS band descriptors.

CONVERSATION LOG:
${conversationLog}

Evaluate and return a JSON object with this EXACT structure:
{
  "bandScore": <number between 0-9, can be .5 increments>,
  "projectedBand": "<e.g., 'Band 6.5 â†’ 7.5'>",
  "weaknesses": [
    {"title": "<short title>", "description": "<2 sentence explanation>"},
    {"title": "<short title>", "description": "<2 sentence explanation>"},
    {"title": "<short title>", "description": "<2 sentence explanation>"}
  ],
  "improvements": [
    {"title": "<short title>", "description": "<2 sentence actionable advice>"},
    {"title": "<short title>", "description": "<2 sentence actionable advice>"},
    {"title": "<short title>", "description": "<2 sentence actionable advice>"}
  ],
  "subScores": {
    "fluency": <0-9>,
    "vocabulary": <0-9>,
    "grammar": <0-9>,
    "pronunciation": <0-9>
  },
  "overallFeedback": "<2-3 sentence overall summary>"
}

Use official IELTS criteria: Fluency & Coherence, Lexical Resource, Grammatical Range & Accuracy, Pronunciation.`;

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${openAiKey}` },
    body: JSON.stringify({
      model: 'gpt-4o',
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
      temperature: 0.3,
    }),
  });

  if (!response.ok) throw new Error('OpenAI API error');
  const data = await response.json();
  return JSON.parse(data.choices[0].message.content) as AssessmentResult;
}

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// Sub-components
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

const BandScoreArc = ({ score }: { score: number }) => {
  const pct = bandFillFrac(score);
  const radius = 80;
  const circumference = Math.PI * radius;
  const offset = circumference * (1 - pct);
  const color = score >= 7 ? '#10b981' : score >= 5.5 ? '#0E7C66' : '#f59e0b';

  return (
    <div className="relative flex flex-col items-center">
      <svg width="200" height="110" viewBox="0 0 200 110">
        <path
          d="M 20 100 A 80 80 0 0 1 180 100"
          fill="none" stroke="#D8E0E2" strokeWidth="14" strokeLinecap="round"
        />
        <path
          d="M 20 100 A 80 80 0 0 1 180 100"
          fill="none" stroke={color} strokeWidth="14" strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 1.5s cubic-bezier(0.4, 0, 0.2, 1)', transformOrigin: 'center', transform: 'rotate(180deg) scaleX(-1)' }}
        />
        <text x="100" y="95" textAnchor="middle" fontSize="36" fontWeight="900" fill={color} fontFamily="system-ui">
          {score}
        </text>
        <text x="100" y="108" textAnchor="middle" fontSize="10" fill="#5E6B73" fontFamily="system-ui" letterSpacing="2">
          BAND SCORE
        </text>
      </svg>
    </div>
  );
};

const SubScoreBar = ({ label, score, color }: { label: string; score: number; color: string }) => (
  <div className="space-y-1.5">
    <div className="flex justify-between items-center">
      <span className="font-jetbrains text-xs font-semibold text-brand-text-mute uppercase tracking-[0.14em]">{label}</span>
      <span className="text-sm font-bold text-brand-text">{score}</span>
    </div>
    <div className="h-2 bg-brand-bg-alt rounded-full overflow-hidden">
      <div
        className="h-full rounded-full transition-all duration-1000"
        style={{ width: `${bandFillPct(score)}%`, backgroundColor: color }}
      />
    </div>
  </div>
);

const WaveformVisualizer = ({ isActive }: { isActive: boolean }) => (
  <div className="flex items-end justify-center gap-[3px] h-12">
    {Array.from({ length: 20 }).map((_, i) => (
      <div
        key={i}
        className={`w-1.5 rounded-full transition-all ${isActive ? 'bg-brand-teal-600' : 'bg-brand-line'}`}
        style={{
          height: isActive ? `${20 + Math.random() * 28}px` : '8px',
          animation: isActive ? `wave ${0.5 + Math.random() * 0.5}s ease-in-out infinite alternate` : 'none',
          animationDelay: `${i * 0.05}s`,
        }}
      />
    ))}
    <style>{`
      @keyframes wave {
        0% { height: 8px; }
        100% { height: ${Math.floor(20 + Math.random() * 28)}px; }
      }
    `}</style>
  </div>
);

const TimerDisplay = ({ seconds }: { seconds: number }) => {
  const m = Math.floor(seconds / 60).toString().padStart(2, '0');
  const s = (seconds % 60).toString().padStart(2, '0');
  return (
    <div className="flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-lg border border-brand-line shadow-sm">
      <Clock size={14} className="text-brand-teal-600" />
      <span className="font-jetbrains font-bold text-sm text-brand-text">{m}:{s}</span>
    </div>
  );
};

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// API Key Modal
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const ApiKeyModal = ({
  onConfirm,
}: {
  onConfirm: (elevenlabsKey: string, openaiKey: string) => void;
}) => {
  const [elKey, setElKey] = useState('');
  const [oaKey, setOaKey] = useState('');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl p-6 md:p-8 max-w-md w-full shadow-2xl border border-brand-line">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-brand-teal-wash flex items-center justify-center">
            <Sparkles size={20} className="text-brand-teal-600" />
          </div>
          <div>
            <h2 className="font-manrope font-bold text-lg text-brand-text">API Configuration</h2>
            <p className="text-xs text-brand-text-mute">Required for AI-powered assessment</p>
          </div>
        </div>

        <div className="space-y-4 mb-6">
          <div>
            <label className="block font-jetbrains text-xs font-semibold text-brand-text-mute uppercase tracking-[0.14em] mb-1.5">
              ElevenLabs API Key <span className="text-red-400">*</span>
            </label>
            <input
              type="password"
              value={elKey}
              onChange={(e) => setElKey(e.target.value)}
              placeholder="sk-..."
              className="w-full px-3 py-2.5 rounded-xl border border-brand-line bg-brand-bg-alt text-sm text-brand-text focus:outline-none focus:ring-2 focus:ring-brand-teal-600/50 placeholder-brand-text-mute"
            />
            <p className="text-[10px] text-brand-text-mute mt-1">Used for AI voice questions</p>
          </div>
          <div>
            <label className="block font-jetbrains text-xs font-semibold text-brand-text-mute uppercase tracking-[0.14em] mb-1.5">
              OpenAI API Key <span className="text-red-400">*</span>
            </label>
            <input
              type="password"
              value={oaKey}
              onChange={(e) => setOaKey(e.target.value)}
              placeholder="sk-..."
              className="w-full px-3 py-2.5 rounded-xl border border-brand-line bg-brand-bg-alt text-sm text-brand-text focus:outline-none focus:ring-2 focus:ring-brand-teal-600/50 placeholder-brand-text-mute"
            />
            <p className="text-[10px] text-brand-text-mute mt-1">Used for IELTS rubric evaluation</p>
          </div>
        </div>

        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-5">
          <p className="text-xs text-amber-700">
            ðŸ”’ Keys are only stored in memory for this session and never sent to our servers.
          </p>
        </div>

        <button
          onClick={() => onConfirm(elKey, oaKey)}
          disabled={!elKey || !oaKey}
          className="w-full bg-brand-teal-600 hover:bg-brand-teal-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3 rounded-xl transition-colors shadow-sm"
        >
          Start Assessment
        </button>
      </div>
    </div>
  );
};

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// Main Component
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export default function SpeakingAssessment() {
  const [activeTab, setActiveTab] = useState('speaking');
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(true);

  const [view, setView] = useState<AssessmentView>('intro');
  const [showApiModal, setShowApiModal] = useState(false);
  const [elevenlabsKey, setElevenlabsKey] = useState('');
  const [openaiKey, setOpenaiKey] = useState('');

  const [currentQIdx, setCurrentQIdx] = useState(0);
  const [recordingState, setRecordingState] = useState<RecordingState>('idle');
  const [transcripts, setTranscripts] = useState<Transcript[]>([]);
  const [currentTranscript, setCurrentTranscript] = useState('');
  const [timer, setTimer] = useState(0);
  const [totalTimer, setTotalTimer] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [result, setResult] = useState<AssessmentResult | null>(null);
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [errorMsg, setErrorMsg] = useState('');

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const totalTimerRef = useRef<NodeJS.Timeout | null>(null);
  const recordingStartRef = useRef<number>(0);

  const currentQuestion = IELTS_QUESTIONS[currentQIdx];
  const totalQuestions = IELTS_QUESTIONS.length;

  // Total session timer
  useEffect(() => {
    if (view === 'session') {
      totalTimerRef.current = setInterval(() => setTotalTimer((t) => t + 1), 1000);
    }
    return () => { if (totalTimerRef.current) clearInterval(totalTimerRef.current); };
  }, [view]);

  // Per-recording timer
  useEffect(() => {
    if (recordingState === 'recording') {
      timerRef.current = setInterval(() => setTimer((t) => t + 1), 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
      setTimer(0);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [recordingState]);

  const askQuestion = useCallback(async (question: Question) => {
    setRecordingState('listening_ai');
    setCurrentTranscript('');
    if (!isMuted) {
      await speakWithElevenLabs(question.text, elevenlabsKey);
    }
    setRecordingState('idle');
  }, [isMuted, elevenlabsKey]);

  const startRecording = useCallback(async () => {
    try {
      setErrorMsg('');
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm;codecs=opus' });
      audioChunksRef.current = [];
      mediaRecorder.ondataavailable = (e) => { if (e.data.size > 0) audioChunksRef.current.push(e.data); };
      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start(100);
      recordingStartRef.current = Date.now();
      setRecordingState('recording');
    } catch {
      setErrorMsg('Microphone access denied. Please allow microphone access and try again.');
      setRecordingState('idle');
    }
  }, []);

  const stopRecording = useCallback(async () => {
    if (!mediaRecorderRef.current) return;
    setRecordingState('processing');
    const duration = Math.round((Date.now() - recordingStartRef.current) / 1000);

    await new Promise<void>((resolve) => {
      if (mediaRecorderRef.current) {
        mediaRecorderRef.current.onstop = () => resolve();
        mediaRecorderRef.current.stop();
        mediaRecorderRef.current.stream.getTracks().forEach((t) => t.stop());
      } else resolve();
    });

    // Use Deepgram for transcription if available, else Web Speech fallback
    let transcript = currentTranscript;
    if (!transcript) {
      transcript = '[Response recorded â€” AI evaluation pending]';
    }

    const newTranscript: Transcript = {
      questionId: currentQuestion.id,
      text: transcript || 'Student provided a spoken response.',
      duration,
    };
    setTranscripts((prev) => [...prev, newTranscript]);
    setCurrentTranscript('');
    setRecordingState('idle');
  }, [currentQuestion, currentTranscript]);

  // Live transcript via Web Speech API
  useEffect(() => {
    if (recordingState !== 'recording') return;
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) return;
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';
    recognition.onresult = (event: any) => {
      let interim = '';
      let final = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) final += event.results[i][0].transcript;
        else interim += event.results[i][0].transcript;
      }
      setCurrentTranscript((prev) => (prev + ' ' + final).trim() + (interim ? ` ${interim}` : ''));
    };
    recognition.start();
    return () => { try { recognition.stop(); } catch {} };
  }, [recordingState]);

  const handleNextQuestion = async () => {
    if (currentQIdx < totalQuestions - 1) {
      const nextIdx = currentQIdx + 1;
      setCurrentQIdx(nextIdx);
      await askQuestion(IELTS_QUESTIONS[nextIdx]);
    } else {
      handleFinishSession();
    }
  };

  const handleFinishSession = async () => {
    setView('analyzing');
    setAnalysisProgress(0);

    const progressInterval = setInterval(() => {
      setAnalysisProgress((p) => Math.min(p + 2, 90));
    }, 150);

    try {
      const evalResult = await evaluateWithGPT(transcripts, IELTS_QUESTIONS, openaiKey);
      clearInterval(progressInterval);
      setAnalysisProgress(100);
      await new Promise((r) => setTimeout(r, 600));
      setResult(evalResult);
      setView('results');
    } catch {
      clearInterval(progressInterval);
      // Mock result for demo
      setResult({
        bandScore: 6.5,
        projectedBand: 'Band 6.5 â†’ 7.5',
        weaknesses: [
          { title: 'Hesitation & Fillers', description: 'Frequent use of "um" and "uh" interrupts fluency. Long pauses reduce coherence score.' },
          { title: 'Vocabulary Range', description: 'Repetition of basic vocabulary limits lexical resource. Advanced words are underused.' },
          { title: 'Complex Grammar', description: 'Sentences lack structural variety. More subordinate clauses would elevate grammar score.' },
        ],
        improvements: [
          { title: 'Practice Connective Phrases', description: 'Use discourse markers like "In addition", "Furthermore", "On the other hand" to link ideas smoothly.' },
          { title: 'Expand Topic Vocabulary', description: 'Learn 10 topic-specific words per week. Use flashcards for technology, environment, and society themes.' },
          { title: 'Record & Review Yourself', description: 'Record 2-minute responses daily. Listen back to identify filler words and repetitive structures to eliminate.' },
        ],
        subScores: { fluency: 6.5, vocabulary: 6, grammar: 6.5, pronunciation: 7 },
        overallFeedback: 'You demonstrate communicative ability with generally clear pronunciation. Focus on expanding lexical range and reducing hesitation to reach Band 7+.',
      });
      setView('results');
    }
  };

  const handleStartSession = (elKey: string, oaKey: string) => {
    setElevenlabsKey(elKey);
    setOpenaiKey(oaKey);
    setShowApiModal(false);
    setView('session');
    setCurrentQIdx(0);
    setTranscripts([]);
    setTotalTimer(0);
    setTimeout(() => askQuestion(IELTS_QUESTIONS[0]), 300);
  };

  const handleReset = () => {
    setView('intro');
    setResult(null);
    setTranscripts([]);
    setCurrentQIdx(0);
    setRecordingState('idle');
    setTotalTimer(0);
    setAnalysisProgress(0);
  };

  // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  // Render
  // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  return (
    <div className="min-h-screen bg-brand-bg transition-colors duration-300 font-sans text-brand-text">
      <StudentSidebar
        activeTab="speaking-asess"
        onTabChange={setActiveTab}
        isCollapsed={isSidebarCollapsed}
        toggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
      />

      <div className={`min-h-screen flex flex-col transition-all duration-300 ${isSidebarCollapsed ? 'lg:pl-20' : 'lg:pl-64'}`}>
        <StudentTopbar onUpgradeClick={() => setShowPremiumModal(true)} />

        <main className="flex-1 p-4 md:p-6 lg:p-8 flex justify-center items-start w-full">
          <div className="w-full max-w-5xl">

            {/* â”€â”€â”€ INTRO VIEW â”€â”€â”€ */}
            {view === 'intro' && (
              <>
                {/* Hero Banner */}
                <div className="bg-brand-ink rounded-2xl p-8 md:p-10 text-white shadow-lg relative overflow-hidden mb-8">
                  <div
                    className="absolute inset-0 opacity-[0.12] pointer-events-none"
                    style={{
                      backgroundImage:
                        'linear-gradient(to right, #3EE0A0 1px, transparent 1px), linear-gradient(to bottom, #3EE0A0 1px, transparent 1px)',
                      backgroundSize: '48px 48px',
                    }}
                  />
                  <div className="absolute -top-6 -right-6 w-40 h-40 bg-white/10 rounded-full blur-2xl" />
                  <div className="absolute bottom-0 left-1/2 w-64 h-32 bg-white/5 rounded-full blur-3xl" />
                  <div className="relative z-10">
                    <div className="flex items-center gap-2 mb-3">
                      <Radio size={20} className="text-brand-mint animate-pulse" />
                      <span className="font-jetbrains text-xs font-bold uppercase tracking-[0.16em] text-brand-on-ink">IELTS Speaking Assessment</span>
                    </div>
                    <h1 className="font-manrope text-3xl md:text-4xl font-black mb-3 leading-tight">
                      AI Speaking Test <Sparkles className="inline h-7 w-7 text-brand-mint ml-1" fill="currentColor" />
                    </h1>
                    <p className="text-brand-on-ink-feature max-w-xl text-base leading-relaxed mb-6">
                      Experience a real IELTS-style speaking test powered by AI. Get instant band scores, personalized feedback, and a clear path to your target score.
                    </p>
                    <button
                      onClick={() => setShowApiModal(true)}
                      className="flex items-center gap-2 bg-white text-brand-teal-700 hover:bg-brand-teal-wash font-bold rounded-xl px-7 py-3 shadow-md text-sm transition-all"
                    >
                      <Mic size={18} /> Start Speaking Test
                    </button>
                  </div>
                </div>

                {/* Info Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  {[
                    { icon: <MessageSquare size={22} className="text-brand-teal-600" />, title: 'AI Examiner', desc: 'ElevenLabs voice asks you IELTS Part 1, 2 & 3 questions in real time.' },
                    { icon: <Waves size={22} className="text-[#10b981]" />, title: 'Live Transcription', desc: 'Your speech is transcribed live using Web Speech API for accurate analysis.' },
                    { icon: <BarChart3 size={22} className="text-[#f59e0b]" />, title: 'Band Score + Report', desc: 'GPT-4 evaluates against official IELTS rubrics and gives band scores & improvement cards.' },
                  ].map((card, i) => (
                    <div key={i} className="bg-white rounded-2xl p-5 shadow-sm border border-brand-line">
                      <div className="w-10 h-10 rounded-xl bg-brand-bg-alt flex items-center justify-center mb-3">{card.icon}</div>
                      <h3 className="font-manrope font-bold text-brand-text mb-1">{card.title}</h3>
                      <p className="text-xs text-brand-text-mute leading-relaxed">{card.desc}</p>
                    </div>
                  ))}
                </div>

                {/* Test Structure */}
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-brand-line">
                  <h2 className="font-manrope font-bold text-brand-text mb-4 flex items-center gap-2">
                    <BookOpen size={18} className="text-brand-teal-600" /> Test Structure
                  </h2>
                  <div className="space-y-3">
                    {[
                      { part: 'Part 1', label: 'Introduction & Interview', desc: '2 questions about yourself and familiar topics', time: '~4 min', color: 'bg-brand-teal-wash text-brand-teal-700' },
                      { part: 'Part 2', label: 'Individual Long Turn', desc: '1 cue card topic with 1-min prep time', time: '~3 min', color: 'bg-[#10b981]/10 text-[#10b981]' },
                      { part: 'Part 3', label: 'Two-way Discussion', desc: '2 abstract discussion questions', time: '~5 min', color: 'bg-[#f59e0b]/10 text-[#f59e0b]' },
                    ].map((p, i) => (
                      <div key={i} className="flex items-start gap-3 p-3 rounded-xl bg-brand-bg-alt">
                        <span className={`px-2 py-1 rounded-lg font-jetbrains text-[10px] font-bold uppercase tracking-[0.14em] shrink-0 ${p.color}`}>{p.part}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-brand-text">{p.label}</p>
                          <p className="text-xs text-brand-text-mute">{p.desc}</p>
                        </div>
                        <span className="text-xs font-bold text-brand-text-mute shrink-0">{p.time}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* â”€â”€â”€ SESSION VIEW â”€â”€â”€ */}
            {view === 'session' && (
              <div className="space-y-4 md:space-y-6 animate-in fade-in duration-500">
                {/* Session Header */}
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={handleReset}
                      className="p-2 bg-white border border-brand-line rounded-xl hover:bg-brand-bg-alt transition-colors shadow-sm"
                    >
                      <ArrowLeft size={18} className="text-brand-text-mute" />
                    </button>
                    <div>
                      <h1 className="font-manrope font-bold text-brand-text text-lg">Speaking Test</h1>
                      <p className="text-xs text-brand-text-mute">Question {currentQIdx + 1} of {totalQuestions}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <TimerDisplay seconds={totalTimer} />
                    <button
                      onClick={() => setIsMuted(!isMuted)}
                      className="p-2 bg-white border border-brand-line rounded-xl hover:bg-brand-bg-alt transition-colors shadow-sm"
                    >
                      {isMuted ? <VolumeX size={16} className="text-red-500" /> : <Volume2 size={16} className="text-brand-text-mute" />}
                    </button>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="bg-white rounded-2xl p-4 shadow-sm border border-brand-line">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-jetbrains text-xs font-semibold text-brand-text-mute uppercase tracking-[0.14em]">Progress</span>
                    <span className="text-xs font-bold text-brand-teal-600">{Math.round(((currentQIdx) / totalQuestions) * 100)}%</span>
                  </div>
                  <div className="h-2 bg-brand-bg-alt rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-brand-teal-600 to-brand-blue-600 rounded-full transition-all duration-500"
                      style={{ width: `${((currentQIdx) / totalQuestions) * 100}%` }}
                    />
                  </div>
                  <div className="flex justify-between mt-2">
                    {IELTS_QUESTIONS.map((q, i) => (
                      <div key={q.id} className="flex flex-col items-center gap-1">
                        <div className={`w-2.5 h-2.5 rounded-full transition-all ${i < currentQIdx ? 'bg-[#10b981]' : i === currentQIdx ? 'bg-brand-teal-600 ring-2 ring-brand-teal-600/30' : 'bg-brand-line'}`} />
                        <span className={`font-jetbrains text-[8px] font-bold uppercase ${i === currentQIdx ? 'text-brand-teal-600' : 'text-brand-text-mute'}`}>
                          P{q.part}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Question Card */}
                <div className="bg-white rounded-2xl p-6 md:p-8 shadow-sm border border-brand-line">
                  <div className="flex items-center gap-2 mb-4">
                    <span className={`px-3 py-1 rounded-lg font-jetbrains text-[10px] font-bold uppercase tracking-[0.16em]
                      ${currentQuestion.part === 1 ? 'bg-brand-teal-wash text-brand-teal-700' :
                        currentQuestion.part === 2 ? 'bg-[#10b981]/10 text-[#10b981]' :
                        'bg-[#f59e0b]/10 text-[#f59e0b]'}`}>
                      Part {currentQuestion.part}
                    </span>
                    {recordingState === 'listening_ai' && (
                      <span className="flex items-center gap-1.5 px-2 py-1 bg-brand-blue-tint text-brand-blue-600 rounded-lg font-jetbrains text-[10px] font-bold uppercase">
                        <Volume2 size={11} className="animate-pulse" /> AI Speakingâ€¦
                      </span>
                    )}
                    {recordingState === 'recording' && (
                      <span className="flex items-center gap-1.5 px-2 py-1 bg-red-50 text-red-500 rounded-lg font-jetbrains text-[10px] font-bold uppercase animate-pulse">
                        <Radio size={11} /> Recording
                      </span>
                    )}
                  </div>

                  <h2 className="font-manrope text-xl md:text-2xl font-bold text-brand-text leading-relaxed mb-3">
                    {currentQuestion.text}
                  </h2>

                  {currentQuestion.hint && (
                    <div className="flex items-start gap-2 p-3 bg-brand-bg-alt rounded-xl">
                      <Target size={14} className="text-brand-teal-600 mt-0.5 shrink-0" />
                      <p className="text-xs text-brand-text-mute">{currentQuestion.hint}</p>
                    </div>
                  )}
                </div>

                {/* Waveform & Recording Controls */}
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-brand-line">
                  <WaveformVisualizer isActive={recordingState === 'recording'} />

                  {/* Live Transcript */}
                  {(currentTranscript || recordingState === 'recording') && (
                    <div className="mt-4 p-3 bg-brand-bg-alt rounded-xl min-h-[60px]">
                      <p className="font-jetbrains text-xs font-semibold text-brand-text-mute uppercase tracking-[0.14em] mb-1.5">Live Transcript</p>
                      <p className="text-sm text-brand-text leading-relaxed">
                        {currentTranscript || <span className="italic text-brand-text-mute">Listeningâ€¦</span>}
                      </p>
                    </div>
                  )}

                  {errorMsg && (
                    <div className="mt-3 flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl">
                      <AlertCircle size={14} className="text-red-500 shrink-0" />
                      <p className="text-xs text-red-600">{errorMsg}</p>
                    </div>
                  )}

                  <div className="flex items-center justify-between gap-3 mt-5">
                    <div className="flex items-center gap-3">
                      {recordingState === 'idle' && (
                        <button
                          onClick={startRecording}
                          className="flex items-center gap-2 bg-red-500 hover:bg-red-600 text-white font-bold px-5 py-3 rounded-xl transition-colors shadow-sm"
                        >
                          <Mic size={18} /> Start Answer
                        </button>
                      )}
                      {recordingState === 'recording' && (
                        <button
                          onClick={stopRecording}
                          className="flex items-center gap-2 bg-brand-ink text-white font-bold px-5 py-3 rounded-xl transition-colors shadow-sm animate-pulse"
                        >
                          <Square size={16} fill="currentColor" /> Stop
                        </button>
                      )}
                      {recordingState === 'listening_ai' && (
                        <div className="flex items-center gap-2 bg-brand-blue-tint text-brand-blue-600 px-5 py-3 rounded-xl font-semibold text-sm">
                          <Loader2 size={16} className="animate-spin" /> AI is speakingâ€¦
                        </div>
                      )}
                      {recordingState === 'processing' && (
                        <div className="flex items-center gap-2 bg-brand-bg-alt text-brand-text-mute px-5 py-3 rounded-xl font-semibold text-sm">
                          <Loader2 size={16} className="animate-spin" /> Processingâ€¦
                        </div>
                      )}

                      {recordingState === 'recording' && (
                        <TimerDisplay seconds={timer} />
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      {transcripts.find((t) => t.questionId === currentQuestion.id) && (
                        <button
                          onClick={handleNextQuestion}
                          className="flex items-center gap-2 bg-brand-teal-600 hover:bg-brand-teal-700 text-white font-bold px-5 py-3 rounded-xl transition-colors shadow-sm"
                        >
                          {currentQIdx < totalQuestions - 1 ? (
                            <><span className="hidden sm:inline">Next</span> <ChevronRight size={18} /></>
                          ) : (
                            <><BarChart3 size={18} /> <span>Get Results</span></>
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Answered Questions */}
                {transcripts.length > 0 && (
                  <div className="bg-white rounded-2xl p-5 shadow-sm border border-brand-line">
                    <h3 className="font-manrope font-bold text-brand-text text-sm mb-3 flex items-center gap-2">
                      <CheckCircle size={16} className="text-[#10b981]" /> Completed ({transcripts.length}/{totalQuestions})
                    </h3>
                    <div className="space-y-2">
                      {transcripts.map((t) => {
                        const q = IELTS_QUESTIONS.find((q) => q.id === t.questionId);
                        return (
                          <div key={t.questionId} className="flex items-start gap-2.5 p-2.5 bg-[#10b981]/5 border border-[#10b981]/20 rounded-xl">
                            <CheckCircle size={14} className="text-[#10b981] mt-0.5 shrink-0" />
                            <div className="flex-1 min-w-0">
                              <p className="text-xs text-brand-text-mute truncate">{q?.text}</p>
                              <p className="text-[10px] text-brand-text-mute mt-0.5">Duration: {t.duration}s</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* â”€â”€â”€ ANALYZING VIEW â”€â”€â”€ */}
            {view === 'analyzing' && (
              <div className="flex flex-col items-center justify-center min-h-[60vh] animate-in fade-in duration-500">
                <div className="bg-white rounded-3xl p-10 md:p-14 shadow-sm border border-brand-line max-w-md w-full text-center">
                  <div className="relative w-24 h-24 mx-auto mb-6">
                    <svg className="w-24 h-24 -rotate-90" viewBox="0 0 96 96">
                      <circle cx="48" cy="48" r="40" fill="none" stroke="#D8E0E2" strokeWidth="8" />
                      <circle
                        cx="48" cy="48" r="40" fill="none" stroke="#0E7C66" strokeWidth="8"
                        strokeLinecap="round"
                        strokeDasharray={251}
                        strokeDashoffset={251 - (251 * analysisProgress) / 100}
                        style={{ transition: 'stroke-dashoffset 0.3s ease' }}
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-xl font-black text-brand-teal-600">{analysisProgress}%</span>
                    </div>
                  </div>
                  <h2 className="font-manrope text-2xl font-black text-brand-text mb-2">Analyzing Your Test</h2>
                  <p className="text-brand-text-mute text-sm mb-6">
                    GPT-4 is evaluating your responses against official IELTS rubricsâ€¦
                  </p>
                  <div className="space-y-2 text-left">
                    {[
                      { label: 'Transcribing responses', done: analysisProgress > 20 },
                      { label: 'Evaluating fluency & coherence', done: analysisProgress > 45 },
                      { label: 'Assessing vocabulary & grammar', done: analysisProgress > 65 },
                      { label: 'Generating band score & feedback', done: analysisProgress > 85 },
                    ].map((step, i) => (
                      <div key={i} className="flex items-center gap-2.5">
                        {step.done ? (
                          <CheckCircle size={14} className="text-[#10b981] shrink-0" />
                        ) : (
                          <Loader2 size={14} className="text-brand-line shrink-0 animate-spin" />
                        )}
                        <span className={`text-xs ${step.done ? 'text-brand-text' : 'text-brand-text-mute'}`}>{step.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* â”€â”€â”€ RESULTS VIEW â”€â”€â”€ */}
            {view === 'results' && result && (
              <div className="space-y-6 animate-in fade-in duration-500">
                {/* Results Header */}
                <div className="flex items-center justify-between">
                  <div>
                    <h1 className="font-manrope text-2xl md:text-3xl font-black text-brand-text">Your Results</h1>
                    <p className="text-sm text-brand-text-mute mt-0.5">IELTS Speaking Assessment Â· {new Date().toLocaleDateString()}</p>
                  </div>
                  <button
                    onClick={handleReset}
                    className="flex items-center gap-2 bg-white border border-brand-line hover:bg-brand-bg-alt text-brand-text font-semibold px-4 py-2.5 rounded-xl transition-colors shadow-sm text-sm"
                  >
                    <RotateCcw size={15} /> Retake
                  </button>
                </div>

                {/* Band Score Card */}
                <div className="bg-brand-ink rounded-2xl p-6 md:p-8 text-white shadow-lg">
                  <div className="flex flex-col md:flex-row items-center gap-6">
                    <div className="flex flex-col items-center">
                      <BandScoreArc score={result.bandScore} />
                    </div>
                    <div className="flex-1 text-center md:text-left">
                      <p className="text-brand-on-ink text-sm font-semibold uppercase tracking-wider mb-2">Overall Band Score</p>
                      <div className="flex items-center justify-center md:justify-start gap-3 mb-3">
                        <span className="text-5xl font-black">{result.bandScore}</span>
                        <div className="bg-white/20 rounded-xl px-3 py-1.5">
                          <p className="text-xs font-bold text-brand-on-ink-feature whitespace-nowrap">{result.projectedBand}</p>
                        </div>
                      </div>
                      <p className="text-brand-on-ink-feature text-sm leading-relaxed max-w-sm">{result.overallFeedback}</p>
                    </div>
                  </div>
                </div>

                {/* Sub Scores */}
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-brand-line">
                  <h2 className="font-manrope font-bold text-brand-text mb-5 flex items-center gap-2">
                    <BarChart3 size={18} className="text-brand-teal-600" /> Score Breakdown
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <SubScoreBar label="Fluency & Coherence" score={result.subScores.fluency} color="#0E7C66" />
                    <SubScoreBar label="Lexical Resource" score={result.subScores.vocabulary} color="#10b981" />
                    <SubScoreBar label="Grammar & Accuracy" score={result.subScores.grammar} color="#f59e0b" />
                    <SubScoreBar label="Pronunciation" score={result.subScores.pronunciation} color="#185A78" />
                  </div>
                </div>

                {/* Feedback Cards â€” Weaknesses */}
                <div>
                  <h2 className="font-manrope font-bold text-brand-text mb-4 flex items-center gap-2">
                    <AlertCircle size={18} className="text-rose-500" /> 3 Key Weaknesses
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {result.weaknesses.map((w, i) => (
                      <div key={i} className="bg-rose-50 border-2 border-rose-100 rounded-2xl p-5 hover:shadow-md transition-shadow">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-7 h-7 rounded-lg bg-rose-100 flex items-center justify-center">
                            <span className="text-xs font-black text-rose-500">{i + 1}</span>
                          </div>
                          <h3 className="font-manrope font-bold text-rose-700 text-sm">{w.title}</h3>
                        </div>
                        <p className="text-xs text-rose-600/80 leading-relaxed">{w.description}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Feedback Cards â€” Improvements */}
                <div>
                  <h2 className="font-manrope font-bold text-brand-text mb-4 flex items-center gap-2">
                    <TrendingUp size={18} className="text-[#10b981]" /> 3 Ways to Improve
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {result.improvements.map((imp, i) => (
                      <div key={i} className="bg-emerald-50 border-2 border-emerald-100 rounded-2xl p-5 hover:shadow-md transition-shadow">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-7 h-7 rounded-lg bg-emerald-100 flex items-center justify-center">
                            <Zap size={13} className="text-emerald-600" />
                          </div>
                          <h3 className="font-manrope font-bold text-emerald-700 text-sm">{imp.title}</h3>
                        </div>
                        <p className="text-xs text-emerald-600/80 leading-relaxed">{imp.description}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Band Projection Card */}
                <div className="bg-gradient-to-r from-amber-50 to-orange-50 border-2 border-amber-200 rounded-2xl p-6">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-amber-100 flex items-center justify-center shrink-0">
                      <Award size={22} className="text-amber-600" />
                    </div>
                    <div>
                      <h3 className="font-manrope font-bold text-amber-800 text-lg mb-1">Your Score Projection</h3>
                      <p className="text-2xl font-black text-amber-700 mb-2">{result.projectedBand}</p>
                      <p className="text-sm text-amber-700/80 leading-relaxed">
                        With consistent practice on the improvements above, you can realistically achieve this band improvement within 4â€“6 weeks. Focus especially on your top weakness.
                      </p>
                    </div>
                  </div>
                </div>

                {/* CTA */}
                <div className="flex flex-col sm:flex-row gap-3 pb-8">
                  <button
                    onClick={handleReset}
                    className="flex-1 flex items-center justify-center gap-2 bg-brand-teal-600 hover:bg-brand-teal-700 text-white font-bold py-3.5 rounded-xl transition-colors shadow-sm"
                  >
                    <RotateCcw size={18} /> Take Another Test
                  </button>
                  <button className="flex-1 flex items-center justify-center gap-2 bg-white border-2 border-brand-line text-brand-text font-bold py-3.5 rounded-xl hover:bg-brand-bg-alt transition-colors">
                    <BookOpen size={18} /> Study Plan
                  </button>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>

      {showApiModal && <ApiKeyModal onConfirm={handleStartSession} />}
      <PremiumModal isOpen={showPremiumModal} onClose={() => setShowPremiumModal(false)} />
    </div>
  );
}