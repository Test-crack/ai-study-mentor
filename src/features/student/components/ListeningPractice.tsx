import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { StudentSidebar } from './dashboard/StudentSidebar';
import { StudentTopbar } from './dashboard/StudentTopbar';
import { Button } from '@/shared/components/ui/button';
import { useToast } from '@/shared/hooks/use-toast';
import {
  ArrowLeft, Send, Headphones, Info,
  Sparkles, Play, Trophy, RotateCcw, CheckCircle2, XCircle, Clock
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/shared/components/ui/card';
import { Badge } from '@/shared/components/ui/badge';

// ── Types ────────────────────────────────────────────────────────────────────

type QuestionType = 'mcq' | 'form';

interface Option {
  id: string;
  text: string;
}

interface Question {
  id: string;
  type: QuestionType;
  text: string;
  options?: Option[];   // for MCQ
  answer: string;       // correct answer
  hint?: string;        // for form questions
}

interface ListeningTask {
  id: string;
  title: string;
  description: string;
  type: string;
  topic: string;
  script: string;
  questions: Question[];
}

interface SectionResult {
  taskId: string;
  results: Array<Question & { userAnswer: string; correct: boolean }>;
}

// ── IELTS Data ────────────────────────────────────────────────────────────────

const IELTS_TASKS: ListeningTask[] = [
  {
    id: '1',
    title: 'Section 1',
    topic: 'Booking a Holiday Apartment',
    type: 'Conversation between two people',
    description: 'Listen to a conversation between a caller and a holiday rental agent about booking an apartment.',
    script: `Agent: Good morning, Sunshine Rentals. How can I help you today?

Caller: Oh, hello. I'm calling because I'd like to book a holiday apartment for next month, if possible.

Agent: Of course! We have several properties available. Could I take your name first, please?

Caller: Yes, it's Patricia Morrison. That's M-O-R-R-I-S-O-N.

Agent: Thank you, Ms Morrison. And how many people will be staying?

Caller: There'll be four of us — two adults and two children. The children are aged seven and ten.

Agent: Perfect. And when would you like to arrive?

Caller: We're hoping to arrive on the fifteenth of August and stay for two weeks.

Agent: Let me check availability... Yes, we have a lovely two-bedroom apartment near the beach. The weekly rate is three hundred and fifty pounds, so that would be seven hundred pounds in total for two weeks.

Caller: That sounds reasonable. Does it include parking?

Agent: Yes, there is one parking space included. The apartment is on the third floor, and there is a lift available.

Caller: Wonderful. Is there a washing machine?

Agent: Yes, all our apartments come fully equipped with a washing machine and dryer. There's also free Wi-Fi throughout.

Caller: That's great. Could you tell me about the deposit?

Agent: We require a deposit of one hundred pounds to confirm the booking. This is fully refundable if you cancel more than thirty days before arrival.

Caller: And what's the address of the apartment?

Agent: It's Flat 3B, Ocean View Terrace, Newquay. The postcode is TR7 2HJ.

Caller: Could you spell that last part, please?

Agent: Yes, it's T for Tango, R for Romeo, seven, two, H for Hotel, J for Juliet.

Caller: Got it. And one more thing — is there a supermarket nearby?

Agent: There's a large supermarket about five minutes' walk away. There are also several restaurants and a pharmacy on the same street.

Caller: Brilliant. I'll go ahead and book it then.`,
    questions: [
      {
        id: 'q1_1', type: 'form',
        text: "1. What is the caller's surname?",
        answer: 'Morrison',
        hint: 'Listen for the name spelled out loud',
      },
      {
        id: 'q1_2', type: 'mcq',
        text: '2. How many people will be staying in the apartment?',
        options: [
          { id: 'A', text: 'A. Two adults only' },
          { id: 'B', text: 'B. Four people in total' },
          { id: 'C', text: 'C. Two adults and three children' },
          { id: 'D', text: 'D. Three people in total' },
        ],
        answer: 'B',
      },
      {
        id: 'q1_3', type: 'form',
        text: '3. What is the arrival date?',
        answer: '15th August',
        hint: 'A specific date is mentioned',
      },
      {
        id: 'q1_4', type: 'mcq',
        text: '4. What is the total cost for two weeks?',
        options: [
          { id: 'A', text: 'A. £350' },
          { id: 'B', text: 'B. £600' },
          { id: 'C', text: 'C. £700' },
          { id: 'D', text: 'D. £800' },
        ],
        answer: 'C',
      },
      {
        id: 'q1_5', type: 'form',
        text: '5. What is the apartment postcode?',
        answer: 'TR7 2HJ',
        hint: 'The agent spells it out letter by letter',
      },
      {
        id: 'q1_6', type: 'mcq',
        text: '6. What is within five minutes\' walk of the apartment?',
        options: [
          { id: 'A', text: 'A. A beach' },
          { id: 'B', text: 'B. A supermarket' },
          { id: 'C', text: 'C. A hospital' },
          { id: 'D', text: 'D. A bus station' },
        ],
        answer: 'B',
      },
    ],
  },
  {
    id: '2',
    title: 'Section 2',
    topic: 'City Library Orientation',
    type: 'Monologue in a social context',
    description: 'Listen to a guide giving an orientation talk at the Westfield City Library for new members.',
    script: `Welcome, everyone, to the Westfield City Library. My name is James Hartley, and I'll be your guide for today's orientation. Whether you're a new member or returning after a while, I hope this tour will help you make the most of everything we offer.

Let me begin with the layout. As you enter through the main doors, you'll find the information desk directly ahead of you. Staff there can help you with membership registration, renewals, and general enquiries. To the left of the information desk is our periodicals section, where you can read newspapers and magazines from both the UK and abroad.

Moving to the right side of the ground floor, you'll find the children's library. It's a bright, colourful space with reading corners and a storytelling area. We run weekly reading sessions for children aged three to eight every Saturday morning at ten o'clock.

Now, if you take the stairs or the lift to the first floor, you'll find our main lending collection. This is where most of our fiction and non-fiction books are shelved. We have over eighty thousand titles available for borrowing. Standard members can borrow up to six items at a time for a period of three weeks.

The reference section is also on the first floor, but please note that reference materials cannot be taken home. These include encyclopaedias, atlases, and legal documents.

On the second floor, we have our study centre. It has forty individual study desks, and ten of those are equipped with computers. You can book a computer in advance by calling reception or using our online portal. Sessions are limited to two hours per day.

We also have two meeting rooms available for hire on the second floor. These can accommodate up to twenty people and are popular with local community groups. Booking must be made at least forty-eight hours in advance.

Finally, I'd like to mention our digital services. All members have free access to our online catalogue, e-book library, and audiobook collection. Simply log in with your membership number on our website. If you have any trouble accessing these services, the IT helpdesk on the first floor will be happy to assist.

Thank you for listening. Please feel free to pick up a copy of our library guide from the information desk, and don't hesitate to ask any of our staff if you need help.`,
    questions: [
      {
        id: 'q2_1', type: 'mcq',
        text: '1. Where is the information desk located?',
        options: [
          { id: 'A', text: 'A. To the left of the entrance' },
          { id: 'B', text: 'B. Directly ahead of the main doors' },
          { id: 'C', text: 'C. On the first floor' },
          { id: 'D', text: 'D. Next to the children\'s library' },
        ],
        answer: 'B',
      },
      {
        id: 'q2_2', type: 'form',
        text: '2. At what time are the Saturday children\'s reading sessions held?',
        answer: '10am',
        hint: 'A specific time is mentioned',
      },
      {
        id: 'q2_3', type: 'mcq',
        text: '3. For how long can members borrow books?',
        options: [
          { id: 'A', text: 'A. Two weeks' },
          { id: 'B', text: 'B. Three weeks' },
          { id: 'C', text: 'C. Four weeks' },
          { id: 'D', text: 'D. One month' },
        ],
        answer: 'B',
      },
      {
        id: 'q2_4', type: 'form',
        text: '4. What is the maximum computer session length per day? (in hours)',
        answer: '2',
        hint: 'A number of hours is stated',
      },
      {
        id: 'q2_5', type: 'mcq',
        text: '5. What must members do to hire a meeting room?',
        options: [
          { id: 'A', text: 'A. Book 24 hours in advance' },
          { id: 'B', text: 'B. Pay a deposit' },
          { id: 'C', text: 'C. Book 48 hours in advance' },
          { id: 'D', text: 'D. Apply online only' },
        ],
        answer: 'C',
      },
      {
        id: 'q2_6', type: 'form',
        text: '6. On which floor is the IT helpdesk located?',
        answer: 'First floor',
        hint: 'The speaker mentions the floor name',
      },
    ],
  },
  {
    id: '3',
    title: 'Section 3',
    topic: 'University Assignment Discussion',
    type: 'Conversation in an academic context',
    description: 'Listen to two students discussing their research project on urban green spaces with their tutor, Dr. Chen.',
    script: `Tutor: Come in, Sarah, Jack. Take a seat. So, you wanted to discuss your research project on urban green spaces?

Sarah: Yes, thanks for seeing us, Dr. Chen. We've been doing quite a lot of reading but we're finding it difficult to narrow down our focus.

Dr. Chen: That's very common at this stage. Tell me what you've looked at so far.

Jack: We started with the environmental benefits — you know, air quality, temperature regulation, biodiversity. There's a huge amount of literature on that.

Dr. Chen: There certainly is. And what about the social dimension?

Sarah: That's actually where we got more interested. We found some compelling research suggesting that access to green spaces significantly reduces stress and improves mental wellbeing in urban populations.

Dr. Chen: Good. So you're leaning towards the psychological and social effects rather than the purely environmental angle?

Jack: Partly, yes. But we also want to look at inequality — how green space is distributed unevenly across cities. Lower-income areas often have far less access.

Dr. Chen: That's an excellent observation, and it's increasingly prominent in urban planning research. Are you planning any primary research, or will this be purely literature-based?

Sarah: We'd like to do a small survey — maybe twenty or thirty participants from different parts of the city — to complement the secondary sources.

Dr. Chen: That sounds manageable. Just be careful about making broad generalisations from such a small sample. Make sure your discussion acknowledges the limitations.

Jack: Definitely. We were also thinking of using some GIS mapping data to show the spatial distribution visually.

Dr. Chen: That could be very effective. Have you used GIS software before?

Jack: I took an introductory module last year, so I have some basic skills. Sarah is stronger on the statistical analysis side.

Dr. Chen: Perfect combination. For your assignment structure, I'd suggest opening with a theoretical framework, then moving through the environmental, social, and equity dimensions before presenting your primary findings. End with a strong conclusion that connects back to your central argument.

Sarah: How long should each section be, roughly?

Dr. Chen: Given that it's a five-thousand-word assignment, I'd say roughly a thousand words on theory and methodology, two thousand on your literature review, fifteen hundred on your primary findings, and five hundred for the conclusion.

Jack: That's really helpful. One last question — are we expected to include policy recommendations?

Dr. Chen: It's not required, but it would definitely strengthen your argument if you can suggest how your findings might inform planning decisions. It shows you understand the real-world relevance of academic research.

Sarah: Great. Thank you, Dr. Chen. We feel much clearer about our direction now.`,
    questions: [
      {
        id: 'q3_1', type: 'mcq',
        text: '1. What aspect of green spaces interests Sarah and Jack most?',
        options: [
          { id: 'A', text: 'A. Environmental benefits' },
          { id: 'B', text: 'B. Social and psychological effects' },
          { id: 'C', text: 'C. Economic impact' },
          { id: 'D', text: 'D. Biodiversity' },
        ],
        answer: 'B',
      },
      {
        id: 'q3_2', type: 'form',
        text: '2. What social issue related to green spaces do they want to explore?',
        answer: 'Uneven distribution',
        hint: 'They describe a problem affecting lower-income areas',
      },
      {
        id: 'q3_3', type: 'mcq',
        text: '3. How many participants are they planning for their survey?',
        options: [
          { id: 'A', text: 'A. 10–15' },
          { id: 'B', text: 'B. 20–30' },
          { id: 'C', text: 'C. 50–100' },
          { id: 'D', text: 'D. Over 100' },
        ],
        answer: 'B',
      },
      {
        id: 'q3_4', type: 'mcq',
        text: '4. What visual method will they use in their assignment?',
        options: [
          { id: 'A', text: 'A. Bar graphs' },
          { id: 'B', text: 'B. Photographs' },
          { id: 'C', text: 'C. GIS mapping' },
          { id: 'D', text: 'D. Infographics' },
        ],
        answer: 'C',
      },
      {
        id: 'q3_5', type: 'form',
        text: '5. How many words should the literature review section be?',
        answer: '2000',
        hint: 'Dr. Chen gives specific word counts for each section',
      },
      {
        id: 'q3_6', type: 'mcq',
        text: '6. What does Dr. Chen say about policy recommendations?',
        options: [
          { id: 'A', text: 'A. They are compulsory' },
          { id: 'B', text: 'B. They are not required but would strengthen the work' },
          { id: 'C', text: 'C. They should be avoided' },
          { id: 'D', text: 'D. They count for extra marks' },
        ],
        answer: 'B',
      },
    ],
  },
  {
    id: '4',
    title: 'Section 4',
    topic: 'The History of Cartography',
    type: 'Academic lecture',
    description: 'Listen to an academic lecture on the history and evolution of mapmaking from ancient Babylon to the modern digital age.',
    script: `Good afternoon, everyone. Today I'd like to take you on a journey through the history of cartography — the science and art of mapmaking — and explore how maps have shaped human understanding of the world.

The earliest known maps date back to ancient Babylon, around 2300 BCE. These were clay tablets that depicted not just physical geography but also the known cosmos. Interestingly, Babylon was placed at the very centre of these early world maps, reflecting the human tendency to position oneself at the heart of the universe.

Ancient Greek scholars made remarkable advances in cartographic theory. Anaximander, in the sixth century BCE, is credited with producing one of the first attempts at a world map based on geometric principles. Later, Ptolemy, writing in the second century CE, introduced the concept of latitude and longitude, a grid system that continues to underpin modern mapping.

However, during the European Middle Ages, cartographic progress stagnated. Maps of this period, known as Mappa Mundi, were less concerned with geographic accuracy and more focused on conveying theological and moral worldviews. Jerusalem was typically placed at the centre, with Europe, Africa, and Asia arranged around it in symbolic rather than geographical configurations.

The Renaissance brought a dramatic revival of interest in accurate representation. The rediscovery of Ptolemy's works in the fifteenth century, combined with the explosion of maritime exploration, created an urgent demand for reliable navigational charts. Portuguese and Spanish explorers needed maps they could actually use at sea.

A pivotal figure of this era was Gerardus Mercator, a Flemish cartographer working in the sixteenth century. His projection — a method of representing the curved surface of the earth on a flat plane — became the standard for nautical navigation. However, Mercator's projection significantly distorts the size of land masses near the poles. Greenland, for example, appears comparable in size to Africa on a Mercator map, when in reality Africa is approximately fourteen times larger.

This distortion sparked considerable controversy in the twentieth century, particularly from political geographers who argued that the map disproportionately enlarged northern, wealthier nations. In 1974, German historian Arno Peters proposed an alternative projection that preserved the relative size of land areas. Though more accurate in terms of area, the Peters projection distorts the shapes of continents.

The twentieth century also witnessed the transformation of cartography through technology. Aerial photography, and later satellite imagery, revolutionised the accuracy and detail of maps. Today, we have access to real-time geographic data through systems like GPS and platforms like Google Earth.

Yet despite these advances, maps remain profoundly interpretive documents. Every map involves choices — what to include, what to omit, how to represent borders — and those choices always reflect particular perspectives and priorities. As the geographer John Harley argued, maps are never neutral. They are instruments of communication, and sometimes, of power.

Thank you. I'll now take a few questions before we move on to the seminar discussion.`,
    questions: [
      {
        id: 'q4_1', type: 'mcq',
        text: '1. What did the earliest Babylonian maps depict?',
        options: [
          { id: 'A', text: 'A. Only physical geography' },
          { id: 'B', text: 'B. Trade routes' },
          { id: 'C', text: 'C. Geography and the cosmos' },
          { id: 'D', text: 'D. City boundaries' },
        ],
        answer: 'C',
      },
      {
        id: 'q4_2', type: 'form',
        text: '2. Who introduced the concept of latitude and longitude?',
        answer: 'Ptolemy',
        hint: 'A Greek scholar is named',
      },
      {
        id: 'q4_3', type: 'mcq',
        text: '3. What was placed at the centre of medieval Mappa Mundi?',
        options: [
          { id: 'A', text: 'A. Babylon' },
          { id: 'B', text: 'B. Rome' },
          { id: 'C', text: 'C. Jerusalem' },
          { id: 'D', text: 'D. Athens' },
        ],
        answer: 'C',
      },
      {
        id: 'q4_4', type: 'form',
        text: '4. What was the nationality of the cartographer Gerardus Mercator?',
        answer: 'Flemish',
        hint: 'His origin is clearly stated',
      },
      {
        id: 'q4_5', type: 'mcq',
        text: '5. What is the main criticism of the Mercator projection?',
        options: [
          { id: 'A', text: 'A. It cannot be used at sea' },
          { id: 'B', text: 'B. It distorts land size near the poles' },
          { id: 'C', text: 'C. It shows the wrong borders' },
          { id: 'D', text: 'D. It was never widely adopted' },
        ],
        answer: 'B',
      },
      {
        id: 'q4_6', type: 'mcq',
        text: '6. According to the lecturer, what do all maps have in common?',
        options: [
          { id: 'A', text: 'A. They are always accurate' },
          { id: 'B', text: 'B. They reflect particular perspectives and priorities' },
          { id: 'C', text: 'C. They are created by governments' },
          { id: 'D', text: 'D. They use the Mercator projection' },
        ],
        answer: 'B',
      },
    ],
  },
];

// ── Band Score Helper ─────────────────────────────────────────────────────────

function getIELTSBand(correct: number, total: number): string {
  const pct = total > 0 ? (correct / total) * 100 : 0;
  if (pct >= 97) return '9.0';
  if (pct >= 89) return '8.5';
  if (pct >= 83) return '8.0';
  if (pct >= 75) return '7.5';
  if (pct >= 67) return '7.0';
  if (pct >= 58) return '6.5';
  if (pct >= 50) return '6.0';
  if (pct >= 42) return '5.5';
  if (pct >= 33) return '5.0';
  return '4.5';
}

function checkAnswer(question: Question, userAnswer: string): boolean {
  const ua = userAnswer.trim().toLowerCase();
  const ca = question.answer.trim().toLowerCase();
  if (question.type === 'mcq') return ua === ca;
  return ca.split(' ').some(word => word.length > 3 && ua.includes(word));
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60).toString().padStart(2, '0');
  const s = (seconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

// ── Main Component ────────────────────────────────────────────────────────────

type ScreenView = 'home' | 'test' | 'results';

export default function ListeningPractice() {
  const navigate = useNavigate();
  const { toast } = useToast();

  // Layout
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  // Navigation
  const [screen, setScreen] = useState<ScreenView>('home');
  const [selectedTask, setSelectedTask] = useState<ListeningTask | null>(null);

  // Answers & submission
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [allResults, setAllResults] = useState<SectionResult[]>([]);

  // TTS Audio
  const [isPlaying, setIsPlaying] = useState(false);
  const [hasPlayed, setHasPlayed] = useState(false);
  const [currentBoundaryIndex, setCurrentBoundaryIndex] = useState(-1);

  // Script visibility
  const [scriptVisible, setScriptVisible] = useState(false);

  // Timer
  const [elapsed, setElapsed] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // --- BUG FIX: Warm up voices on mount ---
  useEffect(() => {
    window.speechSynthesis.getVoices();
  }, []);

  // Timer & Chrome 14-second bug fix
  useEffect(() => {
    let fixInterval: ReturnType<typeof setInterval>;
    
    if (screen === 'test' && isPlaying) {
      // 1. Regular timer
      timerRef.current = setInterval(() => setElapsed(e => e + 1), 1000);
      
      // 2. Chrome 14-Second Hack: Pause and resume very quickly to keep the engine alive on long text
      fixInterval = setInterval(() => {
        window.speechSynthesis.pause();
        window.speechSynthesis.resume();
      }, 14000); 
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    
    return () => { 
      if (timerRef.current) clearInterval(timerRef.current); 
      if (fixInterval) clearInterval(fixInterval);
    };
  }, [screen, isPlaying]);

  // Stop TTS when leaving test screen
  useEffect(() => {
    if (screen !== 'test') {
      window.speechSynthesis?.cancel();
      setIsPlaying(false);
      setCurrentBoundaryIndex(-1);
      setScriptVisible(false);
    }
  }, [screen]);

  // Pre-calculate word boundaries
  const scriptParagraphs = useMemo(() => {
    if (!selectedTask) return [];
    const paragraphs: Array<Array<{ text: string; space: string; start: number; end: number }>> = [];
    let currentIndex = 0;
    const paras = selectedTask.script.split('\n\n');

    paras.forEach((para) => {
      const words: Array<{ text: string; space: string; start: number; end: number }> = [];
      const regex = /([^\s]+)(\s*)/g;
      let match;
      while ((match = regex.exec(para)) !== null) {
        words.push({
          text: match[1],
          space: match[2],
          start: currentIndex + match.index,
          end: currentIndex + match.index + match[1].length
        });
      }
      paragraphs.push(words);
      currentIndex += para.length + 2; 
    });
    return paragraphs;
  }, [selectedTask]);

  const speak = useCallback(() => {
    if (!selectedTask) return;
    window.speechSynthesis.cancel();
    
    const utter = new SpeechSynthesisUtterance(selectedTask.script);
    
    // --- BUG FIX: Prevent Garbage Collection in Chrome ---
    // If not attached to window, Chrome deletes the utterance from memory randomly
    (window as any)._speechBugFix = utter; 

    // --- BUG FIX: Force a Local Voice ---
    // Network voices DO NOT fire 'onboundary' events correctly. 
    const availableVoices = window.speechSynthesis.getVoices();
    const localEnglishVoice = availableVoices.find(v => v.lang.startsWith('en') && v.localService);
    
    if (localEnglishVoice) {
      utter.voice = localEnglishVoice;
    } else {
      // Fallback if no specific local english voice is found
      const backupVoice = availableVoices.find(v => v.localService) || availableVoices.find(v => v.lang.startsWith('en'));
      if (backupVoice) utter.voice = backupVoice;
    }

    utter.rate = 0.88;
    utter.pitch = 1;
    
    utter.onstart = () => { 
      setIsPlaying(true); 
      setHasPlayed(true); 
      setCurrentBoundaryIndex(0); 
      setScriptVisible(true); // Automatically show script
    };
    
    utter.onend = () => { 
      setIsPlaying(false); 
      setCurrentBoundaryIndex(-1); 
      setScriptVisible(false); // Automatically hide script
    };
    
    utter.onerror = () => { 
      setIsPlaying(false); 
      setCurrentBoundaryIndex(-1); 
      setScriptVisible(false); // Automatically hide script
    };
    
    // Track boundary updates
    utter.onboundary = (event) => {
      setCurrentBoundaryIndex(event.charIndex);
    };
    
    window.speechSynthesis.speak(utter);
  }, [selectedTask]);

  const stopAudio = () => {
    window.speechSynthesis.cancel();
    setIsPlaying(false);
    setCurrentBoundaryIndex(-1);
    setScriptVisible(false);
  };

  const openTask = (task: ListeningTask) => {
    stopAudio();
    setSelectedTask(task);
    setAnswers({});
    setScriptVisible(false);
    setElapsed(0);
    setHasPlayed(false);
    setCurrentBoundaryIndex(-1);
    setScreen('test');
  };

  const handleBack = () => {
    stopAudio();
    setScreen('home');
    setSelectedTask(null);
  };

  const handleOptionSelect = (questionId: string, optionId: string) => {
    setAnswers(prev => ({ ...prev, [questionId]: optionId }));
  };

  const handleFormInput = (questionId: string, value: string) => {
    setAnswers(prev => ({ ...prev, [questionId]: value }));
  };

  const handleSubmit = async () => {
    if (!selectedTask) return;

    const unanswered = selectedTask.questions.filter(q => !answers[q.id] || answers[q.id].trim() === '');
    if (unanswered.length > 0) {
      toast({
        title: 'Incomplete Test',
        description: `Please answer all ${selectedTask.questions.length} questions before submitting.`,
        variant: 'destructive',
      });
      return;
    }

    setSubmitting(true);
    setTimeout(() => {
      const results = selectedTask.questions.map(q => ({
        ...q,
        userAnswer: answers[q.id] || '—',
        correct: checkAnswer(q, answers[q.id] || ''),
      }));

      setAllResults(prev => {
        const filtered = prev.filter(r => r.taskId !== selectedTask.id);
        return [...filtered, { taskId: selectedTask.id, results }];
      });

      const score = results.filter(r => r.correct).length;
      setSubmitting(false);
      toast({
        title: `${selectedTask.title} Complete!`,
        description: `You scored ${score} out of ${selectedTask.questions.length}.`,
      });
      setScreen('results');
    }, 1000);
  };

  // Find precisely which word to highlight
  let activeWordStart = -1;
  if (isPlaying && currentBoundaryIndex >= 0) {
    let found = -1;
    for (const para of scriptParagraphs) {
      for (const wordObj of para) {
        if (wordObj.start <= currentBoundaryIndex) {
          found = wordObj.start;
        } else {
          break; 
        }
      }
    }
    activeWordStart = found;
  }

  // Derived values
  const totalCorrect = allResults.reduce((sum, r) => sum + r.results.filter(q => q.correct).length, 0);
  const totalQ = allResults.reduce((sum, r) => sum + r.results.length, 0);
  const band = getIELTSBand(totalCorrect, totalQ);

  const answeredCount = selectedTask
    ? selectedTask.questions.filter(q => answers[q.id] && answers[q.id].trim() !== '').length
    : 0;

  // ── HOME VIEW ──────────────────────────────────────────────────────────────

  const renderHome = () => (
    <div className="space-y-8">
      {/* Banner */}
      <div className="bg-[#7B61FF] rounded-2xl p-8 md:p-10 text-white shadow-md relative overflow-hidden">
        <div className="absolute top-0 right-0 -mt-4 -mr-4 w-32 h-32 bg-white opacity-10 rounded-full blur-2xl" />
        <div className="relative z-10">
          <h1 className="text-3xl font-bold mb-3 flex items-center gap-2">
            IELTS Listening Practice <Sparkles className="h-6 w-6 text-yellow-300" fill="currentColor" />
          </h1>
          <p className="text-indigo-50 max-w-2xl text-base md:text-lg leading-relaxed">
            Improve your listening skills with authentic voice scripts. Select a section below to practice
            comprehension of accents, specific details, and overall meaning to aim for a band 7+.
          </p>
        </div>
      </div>

      {/* Section Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-2 gap-6">
        {IELTS_TASKS.map((task) => {
          const done = allResults.find(r => r.taskId === task.id);
          const score = done ? done.results.filter(q => q.correct).length : null;
          return (
            <Card
              key={task.id}
              onClick={() => openTask(task)}
              className="border border-slate-200 dark:border-slate-800 shadow-sm bg-white dark:bg-slate-900
                hover:shadow-md hover:border-[#7B61FF] dark:hover:border-[#7B61FF] transition-all cursor-pointer group"
            >
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start gap-4">
                  <div className="flex flex-col gap-1">
                    <span className="text-xs font-bold uppercase tracking-widest text-[#7B61FF] dark:text-[#9b86ff]">
                      {task.title}
                    </span>
                    <CardTitle className="text-lg font-bold text-slate-800 dark:text-slate-100
                      group-hover:text-[#7B61FF] dark:group-hover:text-[#9b86ff] transition-colors leading-tight">
                      {task.topic}
                    </CardTitle>
                  </div>
                  <div className="flex flex-col items-end gap-2 flex-shrink-0">
                    {done ? (
                      <Badge className="bg-emerald-50 text-emerald-700 hover:bg-emerald-100
                        dark:bg-emerald-900/30 dark:text-emerald-400">
                        {score}/{task.questions.length} ✓
                      </Badge>
                    ) : (
                      <Badge className="bg-indigo-50 text-[#7B61FF] hover:bg-indigo-100
                        dark:bg-[#7B61FF]/20 dark:text-[#9b86ff]">
                        New
                      </Badge>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-slate-500 dark:text-slate-400 text-sm mb-4 line-clamp-2">
                  {task.description}
                </p>
                <div className="flex items-center gap-2 text-xs text-slate-400 dark:text-slate-500 mb-4">
                  <span className="bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-full">{task.type}</span>
                </div>
                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center
                  text-xs font-medium text-slate-500 dark:text-slate-500">
                  <span className="flex items-center gap-1">
                    <Headphones className="w-3 h-3" /> {task.questions.length} Questions
                  </span>
                  <span className="text-[#7B61FF] dark:text-[#9b86ff] flex items-center
                    group-hover:translate-x-1 transition-transform">
                    {done ? 'Retry' : 'Start Listening'} <ArrowLeft className="h-3 w-3 ml-1 rotate-180" />
                  </span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Overall Score Button */}
      {allResults.length > 0 && (
        <Card
          className="border border-[#7B61FF]/30 bg-indigo-50/50 dark:bg-[#7B61FF]/10
            dark:border-[#7B61FF]/30 cursor-pointer hover:bg-indigo-100/50 transition-all"
          onClick={() => setScreen('results')}
        >
          <CardContent className="p-5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Trophy className="w-6 h-6 text-[#7B61FF] dark:text-[#9b86ff]" />
              <div>
                <p className="font-semibold text-slate-800 dark:text-slate-100">Overall Progress</p>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  {totalCorrect}/{totalQ} correct · Estimated Band {band}
                </p>
              </div>
            </div>
            <span className="text-[#7B61FF] dark:text-[#9b86ff] font-medium text-sm">View Results →</span>
          </CardContent>
        </Card>
      )}

      <p className="text-sm text-slate-400 dark:text-slate-500 bg-slate-50 dark:bg-slate-900 rounded-xl p-4 border border-slate-100 dark:border-slate-800">
        💡 <strong>Exam Tip:</strong> In the real IELTS exam, you hear each recording only once. Use the "Play Audio" button and resist using the script — it's there for review only.
      </p>
    </div>
  );

  // ── TEST VIEW ──────────────────────────────────────────────────────────────

  const renderTest = () => {
    if (!selectedTask) return null;
    return (
      <div className="flex flex-col flex-1 min-h-[calc(100vh-140px)]">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <Button
            variant="ghost"
            onClick={handleBack}
            className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white
              hover:bg-slate-100 dark:hover:bg-slate-800 -ml-2 w-fit"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Modules
          </Button>
          <div className="flex items-center gap-3">
            {/* Timer */}
            <div className="flex items-center gap-1.5 text-sm font-mono text-slate-500 dark:text-slate-400
              bg-slate-100 dark:bg-slate-800 px-3 py-2 rounded-lg">
              <Clock className="w-4 h-4" />
              {formatTime(elapsed)}
            </div>
            <Button
              onClick={handleSubmit}
              disabled={submitting}
              className="bg-[#7B61FF] hover:bg-[#6a50e5] text-white shadow-sm w-full sm:w-auto"
            >
              {submitting ? (
                <span className="flex items-center gap-2">
                  <span className="w-3 h-3 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  Submitting...
                </span>
              ) : (
                <span className="flex items-center"><Send className="w-4 h-4 mr-2" /> Submit Answers</span>
              )}
            </Button>
          </div>
        </div>

        {/* Split Content */}
        <div className="flex flex-col lg:flex-row gap-6 flex-grow min-h-0">

          {/* Left: Audio Player & Info */}
          <div className="w-full lg:w-[40%] flex flex-col gap-5">

            {/* Audio Card */}
            <Card className="border-none shadow-sm bg-white dark:bg-slate-900 flex-shrink-0">
              <CardHeader className="pb-4">
                <div className="flex items-center gap-2 text-[#7B61FF] dark:text-[#9b86ff] mb-2">
                  <Headphones className="h-5 w-5" />
                  <span className="text-sm font-bold uppercase tracking-wider">Audio Player</span>
                </div>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <CardTitle className="text-xl text-slate-800 dark:text-white leading-tight">
                      {selectedTask.title}: {selectedTask.topic}
                    </CardTitle>
                    <CardDescription className="dark:text-slate-400 mt-1 text-xs">
                      {selectedTask.type}
                    </CardDescription>
                  </div>
                  <Badge variant="secondary" className="flex-shrink-0 text-xs">
                    {selectedTask.questions.length} Qs
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                
                {/* TTS Controls */}
                <div className="bg-slate-50 dark:bg-slate-800/80 p-4 rounded-xl border border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-3 flex-wrap">
                    {!isPlaying && !hasPlayed && (
                      <Button onClick={speak} className="bg-[#7B61FF] hover:bg-[#6a50e5] text-white gap-2 flex-1 sm:flex-none">
                        <Play className="w-4 h-4" />
                        Play Audio
                      </Button>
                    )}

                    {isPlaying && (
                      <Button disabled className="bg-[#7B61FF]/60 text-white gap-2 flex-1 sm:flex-none cursor-not-allowed">
                        <span className="w-3 h-3 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                        Playing Audio...
                      </Button>
                    )}

                    {!isPlaying && hasPlayed && (
                      <Button disabled className="bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400 gap-2 flex-1 sm:flex-none cursor-not-allowed">
                        <CheckCircle2 className="w-4 h-4" />
                        Audio Finished
                      </Button>
                    )}

                    {isPlaying && (
                      <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 text-sm font-medium">
                        <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                        Now playing…
                      </div>
                    )}
                  </div>

                  {!hasPlayed && (
                    <p className="text-xs text-slate-400 mt-3">
                      👆 Press <strong>Play Audio</strong> to hear the recording. You can only listen to it once.
                    </p>
                  )}
                </div>

                {/* Script Container (Auto-shows when playing) */}
                {scriptVisible && (
                  <div className="mt-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200
                    dark:border-slate-700 p-4 max-h-72 overflow-y-auto space-y-3">
                    {scriptParagraphs.map((para, i) => (
                      <p key={i} className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                        {para.map((wordObj, j) => {
                          const isHighlighted = isPlaying && wordObj.start === activeWordStart;
                          return (
                            <React.Fragment key={j}>
                              {isHighlighted ? (
                                <mark className="bg-[#7B61FF]/30 text-indigo-900 dark:bg-[#7B61FF]/50 dark:text-white rounded px-1 transition-colors">
                                  {wordObj.text}
                                </mark>
                              ) : (
                                wordObj.text
                              )}
                              {wordObj.space}
                            </React.Fragment>
                          );
                        })}
                      </p>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Tips Card */}
            <Card className="border-none shadow-sm bg-blue-50 dark:bg-blue-900/10 flex-shrink-0">
              <CardContent className="p-5 flex gap-3">
                <Info className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-bold text-blue-800 dark:text-blue-400 mb-2">Testing Tips</h4>
                  <ul className="text-sm text-blue-700 dark:text-blue-400/80 space-y-1.5 list-disc list-inside">
                    <li>Read all questions <strong>before</strong> pressing play.</li>
                    <li>In the real exam you hear the recording <strong>once only</strong>.</li>
                    <li>Answer while listening — don't wait until the end.</li>
                    <li>For short answers, spelling must be correct.</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right: Questions */}
          <Card className="w-full lg:w-[60%] border border-slate-200 dark:border-slate-800 shadow-sm
            bg-white dark:bg-slate-900 flex flex-col overflow-hidden">
            <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex justify-between
              items-center bg-slate-50/50 dark:bg-slate-900/50 z-10">
              <h3 className="font-semibold text-slate-700 dark:text-slate-200 text-sm">Questions</h3>
              <Badge
                variant="secondary"
                className={`font-medium ${
                  answeredCount === selectedTask.questions.length
                    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                    : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                }`}
              >
                {answeredCount} / {selectedTask.questions.length} Answered
              </Badge>
            </div>

            <div className="flex-grow overflow-y-auto p-6 space-y-8">
              {selectedTask.questions.map((question) => (
                <div key={question.id} className="space-y-4">
                  <h4 className="text-base font-medium text-slate-800 dark:text-slate-100 leading-relaxed">
                    {question.text}
                  </h4>

                  {question.type === 'mcq' && question.options ? (
                    <div className="grid grid-cols-1 gap-3">
                      {question.options.map((option) => {
                        const isSelected = answers[question.id] === option.id;
                        return (
                          <div
                            key={option.id}
                            onClick={() => handleOptionSelect(question.id, option.id)}
                            className={`relative p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 flex items-center
                              ${isSelected
                                ? 'border-[#7B61FF] bg-indigo-50 dark:border-[#7B61FF] dark:bg-[#7B61FF]/10'
                                : 'border-slate-200 bg-white hover:border-[#7B61FF]/50 dark:border-slate-700 dark:bg-slate-800/50 dark:hover:border-[#7B61FF]/50'
                              }`}
                          >
                            <div className={`w-5 h-5 rounded-full border-2 mr-4 flex items-center justify-center flex-shrink-0 transition-colors
                              ${isSelected ? 'border-[#7B61FF]' : 'border-slate-300 dark:border-slate-600'}`}>
                              {isSelected && <div className="w-2.5 h-2.5 rounded-full bg-[#7B61FF]" />}
                            </div>
                            <span className={`text-sm ${isSelected ? 'text-indigo-900 font-medium dark:text-indigo-200' : 'text-slate-700 dark:text-slate-300'}`}>
                              {option.text}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {question.hint && (
                        <p className="text-xs text-slate-400 dark:text-slate-500 flex items-center gap-1">
                          💬 {question.hint}
                        </p>
                      )}
                      <input
                        type="text"
                        value={answers[question.id] || ''}
                        onChange={e => handleFormInput(question.id, e.target.value)}
                        placeholder="Type your answer here…"
                        className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 dark:border-slate-700
                          bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 text-sm
                          placeholder-slate-400 dark:placeholder-slate-500 outline-none
                          focus:border-[#7B61FF] dark:focus:border-[#7B61FF] transition-colors"
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    );
  };

  // ── RESULTS VIEW ───────────────────────────────────────────────────────────

  const renderResults = () => (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          onClick={() => setScreen('home')}
          className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white
            hover:bg-slate-100 dark:hover:bg-slate-800 -ml-2"
        >
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Modules
        </Button>
      </div>

      {/* Band Score Summary */}
      <div className="bg-[#7B61FF] rounded-2xl p-8 text-white shadow-md relative overflow-hidden">
        <div className="absolute top-0 right-0 -mt-4 -mr-4 w-32 h-32 bg-white opacity-10 rounded-full blur-2xl" />
        <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div>
            <p className="text-indigo-200 text-sm font-medium uppercase tracking-widest mb-2">Overall Results</p>
            <h2 className="text-3xl font-bold">
              {totalCorrect} / {totalQ} Correct
            </h2>
            <p className="text-indigo-100 mt-1 text-sm">
              Across {allResults.length} section{allResults.length !== 1 ? 's' : ''} completed
            </p>
          </div>
          <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-5 text-center min-w-[110px]">
            <p className="text-indigo-200 text-xs uppercase tracking-widest mb-1">Est. Band</p>
            <p className="text-5xl font-black">{band}</p>
          </div>
        </div>
      </div>

      {/* Per-section breakdown */}
      {allResults.map((r) => {
        const task = IELTS_TASKS.find(t => t.id === r.taskId);
        if (!task) return null;
        const sectionCorrect = r.results.filter(q => q.correct).length;
        return (
          <Card key={r.taskId} className="border border-slate-200 dark:border-slate-800 shadow-sm bg-white dark:bg-slate-900">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold uppercase tracking-widest text-[#7B61FF] dark:text-[#9b86ff]">
                    {task.title}
                  </span>
                  <CardTitle className="text-lg text-slate-800 dark:text-slate-100 mt-0.5">
                    {task.topic}
                  </CardTitle>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-black text-slate-800 dark:text-slate-100">
                    {sectionCorrect}<span className="text-base font-normal text-slate-400">/{task.questions.length}</span>
                  </p>
                  <button
                    onClick={() => openTask(task)}
                    className="flex items-center gap-1 text-xs text-[#7B61FF] dark:text-[#9b86ff] mt-1 hover:underline"
                  >
                    <RotateCcw className="w-3 h-3" /> Retry
                  </button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {r.results.map((q, i) => (
                <div
                  key={q.id}
                  className={`p-4 rounded-xl border-l-4 ${
                    q.correct
                      ? 'border-l-emerald-500 bg-emerald-50 dark:bg-emerald-900/10'
                      : 'border-l-red-400 bg-red-50 dark:bg-red-900/10'
                  }`}
                >
                  <div className="flex items-start gap-2">
                    {q.correct
                      ? <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 mt-0.5 flex-shrink-0" />
                      : <XCircle className="w-4 h-4 text-red-500 dark:text-red-400 mt-0.5 flex-shrink-0" />
                    }
                    <div className="flex-1">
                      <p className="text-sm font-medium text-slate-700 dark:text-slate-200">{q.text}</p>
                      <p className={`text-xs mt-1 ${q.correct ? 'text-emerald-700 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                        Your answer: <strong>{q.userAnswer}</strong>
                      </p>
                      {!q.correct && (
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                          Correct answer: <strong className="text-emerald-700 dark:text-emerald-400">{q.answer}</strong>
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        );
      })}

      {allResults.length < IELTS_TASKS.length && (
        <Card className="border border-dashed border-[#7B61FF]/40 bg-indigo-50/30 dark:bg-[#7B61FF]/5 dark:border-[#7B61FF]/20">
          <CardContent className="p-6 text-center">
            <p className="text-slate-500 dark:text-slate-400 text-sm mb-3">
              Complete all 4 sections for a full band score estimate.
            </p>
            <Button
              onClick={() => setScreen('home')}
              className="bg-[#7B61FF] hover:bg-[#6a50e5] text-white"
            >
              Continue Practising →
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );

  // ── Layout ─────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-slate-950 transition-colors duration-300">
      <StudentSidebar
        activeTab="listening"
        onTabChange={(tab) => {
          if (tab === 'dashboard') navigate('/student/dashboard');
          if (tab === 'settings') navigate('/student/profile');
        }}
        isCollapsed={isSidebarCollapsed}
        toggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
      />

      <div className={`transition-all duration-300 ${isSidebarCollapsed ? 'lg:pl-24' : 'lg:pl-72'} flex flex-col min-h-screen`}>
        <StudentTopbar onUpgradeClick={() => {}} />

        <main className="flex-1 p-6 max-w-7xl mx-auto w-full flex flex-col animate-in fade-in slide-in-from-bottom-4 duration-500">
          {screen === 'home' && renderHome()}
          {screen === 'test' && renderTest()}
          {screen === 'results' && renderResults()}
        </main>
      </div>
    </div>
  );
}
// }TR7 2HJ