// ─────────────────────────────────────────────────────────────────────────────
// FILE LOCATION: src/features/student/components/IeltsWriting.tsx
// REPLACE the entire existing file with this.
// ─────────────────────────────────────────────────────────────────────────────

import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { StudentSidebar } from './dashboard/StudentSidebar';
import { StudentTopbar } from './dashboard/StudentTopbar';
import { Button } from '@/shared/components/ui/button';
import { useToast } from '@/shared/hooks/use-toast';
import {
  ArrowLeft, Send, PenTool, BookOpen, Sparkles, History,
  CheckCircle, BarChart2, CheckCircle2, ArrowRight,
  Lightbulb, AlertCircle, Loader2, MessageSquarePlus, X,
  Target, Smile, Frown, Meh, TrendingUp, Quote,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/shared/components/ui/card';
import { Badge } from '@/shared/components/ui/badge';
import {
  fetchWritingTasks, submitWritingSession, fetchWritingHistory,
  WritingAssessmentHistoryItem, WritingTask,
} from '../services/ieltsWritingService';
import { useMomentum } from "@/features/student/Context/MomentumContext";
import { stampPassportSlot } from '@/features/student/utils/passportUtils';
import { generateLocalNudge } from '@/features/student/utils/writingNudgeGenerator';

// ─── Types ────────────────────────────────────────────────────────────────────

type ViewState = 'library' | 'writing' | 'history' | 'results';

interface NudgeResponse {
  nudge:           string;
  sentence_frame:  string;
  punctuation_tip: string | null;
}

interface ResponseCritique {
  overall_tone:        'positive' | 'mixed' | 'critical';
  opening_quality:     string;
  argument_depth:      string;
  vocabulary_note:     string;
  structural_feedback: string;
  examiner_flag:       string | null;
  improvement_focus:   string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const MOCK_ASSIGNMENTS: WritingTask[] = [];
const MAX_NUDGES      = 3;
const NUDGE_MIN_WORDS = 50;

// ─── Response Critique Generator ─────────────────────────────────────────────
// Analyses the student's submitted essay and generates specific criticism
// based on what they actually wrote — not generic feedback.

function generateResponseCritique(
  essayText: string,
  wordCount: number,
  bandScore: number | string,
): ResponseCritique {
  const text  = essayText.trim();
  const lower = text.toLowerCase();
  const band  = parseFloat(String(bandScore)) || 5.0;
  const words = text.split(/\s+/);

  // ── Opening quality ──────────────────────────────────────────────────────
  const firstSentence = text.split(/[.!?]/)[0]?.trim() || '';
  const firstWords    = firstSentence.toLowerCase();

  let opening_quality = '';
  if (firstWords.startsWith('i think') || firstWords.startsWith('i believe') || firstWords.startsWith('i agree') || firstWords.startsWith('i disagree')) {
    opening_quality = `Your essay opens with "${firstSentence.slice(0, 60)}..." — starting directly with "I think" or "I believe" is a common beginner pattern. IELTS examiners prefer a paraphrased version of the question or a contextual statement before your position. This signals academic register immediately.`;
  } else if (firstWords.startsWith('in this essay') || firstWords.startsWith('in my essay')) {
    opening_quality = `Your introduction begins with "In this essay..." — this is one of the most overused openers in IELTS writing and examiners notice it immediately. Try reframing the topic statement instead: introduce the debate, then state your position.`;
  } else if (firstWords.startsWith('nowadays') || firstWords.startsWith('in today')) {
    opening_quality = `You opened with a broad contextual statement — that's a solid approach. Make sure this statement directly connects to the specific claim in the question, not just the general theme.`;
  } else if (firstSentence.length > 120) {
    opening_quality = `Your opening sentence is quite long (${firstSentence.split(/\s+/).length} words). Long opening sentences can obscure your main point. Try splitting it into two — one to set context, one to state your position.`;
  } else {
    opening_quality = `Your opening is reasonably clear. To strengthen it further, ensure the first paragraph explicitly paraphrases the question prompt and ends with a clear thesis statement that maps your body paragraphs.`;
  }

  // ── Argument depth ────────────────────────────────────────────────────────
  const hasExample   = /for example|for instance|such as|a case in point|to illustrate/.test(lower);
  const hasStats     = /\d+\s*%|percent|million|billion|studies show|research (shows|suggests|indicates)|according to/.test(lower);
  const hasCounterArg = /however|on the other hand|despite|although|while some|critics argue|opponents|conversely|nevertheless/.test(lower);
  const paragraphs   = text.split(/\n\n+/).filter(p => p.trim().length > 30);

  let argument_depth = '';
  if (!hasExample && !hasStats) {
    argument_depth = `Your argument relies entirely on assertion — you state positions but provide no concrete examples or evidence to support them. Every claim needs a supporting example or reference. Even approximate statistics ("studies suggest that...") significantly raise the Task Response score.`;
  } else if (hasExample && !hasStats) {
    argument_depth = `You've used examples to support your argument — good. The next level is adding data or citing a real-world reference. You don't need precise figures; approximate references like "research in Nordic countries suggests..." signal academic awareness to the examiner.`;
  } else if (hasStats && !hasExample) {
    argument_depth = `You've referenced evidence or data — that's a positive signal. Pairing this with a specific illustrative example (a country, a person, a scenario) makes the argument more concrete and easier for the examiner to follow.`;
  } else {
    argument_depth = `Your argument has good support with both examples and evidence — this is what pushes Task Response scores above 6. The remaining gap is usually in how explicitly you connect evidence back to your thesis. After each example, add a sentence that says "This demonstrates that..." to close the reasoning loop.`;
  }

  if (!hasCounterArg && band < 7) {
    argument_depth += ` You haven't acknowledged a counterargument. For bands 7+, examiners expect you to address the opposing view — even briefly — before refuting it. One sentence of concession followed by a rebuttal can lift your score noticeably.`;
  }

  // ── Vocabulary note ───────────────────────────────────────────────────────
  const repeatedWords: Record<string, number> = {};
  words.forEach(w => {
    const clean = w.toLowerCase().replace(/[^a-z]/g, '');
    if (clean.length > 4) {
      repeatedWords[clean] = (repeatedWords[clean] || 0) + 1;
    }
  });
  const overusedWords = Object.entries(repeatedWords)
    .filter(([w, count]) => count >= 4 && !['their', 'there', 'which', 'would', 'could', 'should', 'about', 'these', 'those', 'people', 'think', 'things'].includes(w))
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);

  const hasInformalLang = /\b(gonna|wanna|kinda|sorta|lots of|a lot of things|stuff|things like that|you know|basically)\b/.test(lower);
  const hasSophisticatedVocab = /\b(moreover|furthermore|consequently|nevertheless|albeit|paradigm|ubiquitous|precipitate|exacerbate|ameliorate|concomitant|juxtapose)\b/.test(lower);

  let vocabulary_note = '';
  if (overusedWords.length > 0) {
    const wordList = overusedWords.map(([w, c]) => `"${w}" (${c}x)`).join(', ');
    vocabulary_note = `Lexical repetition detected: ${wordList}. Repeating key content words reduces your Lexical Resource score. Build a list of synonyms for your topic before writing — for instance, if "important" appears frequently, rotate with "crucial", "significant", "vital", or "essential".`;
  } else if (hasInformalLang) {
    vocabulary_note = `Some informal language detected in your response. IELTS Writing requires formal academic register throughout. Avoid contractions, colloquial expressions, and vague terms like "stuff" or "a lot of things". Replace them with precise academic alternatives.`;
  } else if (hasSophisticatedVocab) {
    vocabulary_note = `Good use of advanced vocabulary — this is exactly what examiners look for in the Lexical Resource criterion. Make sure each advanced word is used accurately in context; incorrect usage of sophisticated words can lower your score more than using a simpler correct word.`;
  } else {
    vocabulary_note = `Your vocabulary is functional but could be more varied. Aim to use topic-specific vocabulary and avoid repeating the same words. Introducing 3–4 precise academic words per paragraph demonstrates the range examiners are looking for at band 7+.`;
  }

  // ── Structural feedback ───────────────────────────────────────────────────
  const sentenceCount = text.split(/[.!?]+/).filter(s => s.trim().length > 5).length;
  const avgSentenceLength = wordCount / Math.max(sentenceCount, 1);

  let structural_feedback = '';
  if (paragraphs.length < 3) {
    structural_feedback = `Your essay appears to have fewer than 3 clearly separated paragraphs. A standard Task 2 structure is: Introduction → Body Paragraph 1 → Body Paragraph 2 → Conclusion. Lack of clear paragraphing is penalised under Coherence & Cohesion regardless of content quality.`;
  } else if (avgSentenceLength > 35) {
    structural_feedback = `Your average sentence length is high (roughly ${Math.round(avgSentenceLength)} words per sentence). While complex sentences demonstrate grammatical range, sentences over 40 words often become unclear. Mix long and short sentences: one complex sentence followed by a shorter, punchy one creates rhythm and aids clarity.`;
  } else if (avgSentenceLength < 12) {
    structural_feedback = `Your sentences are quite short on average (roughly ${Math.round(avgSentenceLength)} words). Short sentences limit your Grammatical Range & Accuracy score. Try combining related short sentences using subordinate clauses: "Although X, Y, which means Z" shows the examiner you can handle complex structures.`;
  } else {
    structural_feedback = `Your sentence variety is reasonable. To push higher, ensure each body paragraph has a clear topic sentence, 2–3 supporting sentences, and a closing sentence that links back to the thesis — this explicit structure makes your argument easy to follow under exam conditions.`;
  }

  // ── Examiner flag ─────────────────────────────────────────────────────────
  let examiner_flag: string | null = null;

  const hasNoConclusion = !lower.includes('in conclusion') && !lower.includes('to conclude') && !lower.includes('in summary') && !lower.includes('to summarise') && !lower.includes('overall') && wordCount > 150;
  const hasAllCaps = /[A-Z]{4,}/.test(text);
  const hasLowWordCount = wordCount < 200;
  const hasRepetitiveOpener = (text.match(/^(I think|I believe|I agree|I disagree)/i) !== null);

  if (hasLowWordCount) {
    examiner_flag = `⚠️ Word count alert: you submitted ${wordCount} words. IELTS Task 2 requires a minimum of 250 words. Responses under 250 words receive an automatic penalty on Task Achievement regardless of quality. Always aim for 260–280 words.`;
  } else if (hasNoConclusion) {
    examiner_flag = `⚠️ Your response appears to end without a clear conclusion paragraph. IELTS examiners expect a concluding statement that restates your position and summarises key points — without it, your Coherence & Cohesion score suffers significantly.`;
  } else if (hasAllCaps) {
    examiner_flag = `⚠️ Avoid using ALL CAPS for emphasis in academic writing. Instead, use sentence structure to create emphasis — place the important idea at the end of the sentence where it naturally carries more weight.`;
  }

  // ── Improvement focus ─────────────────────────────────────────────────────
  const scores: Record<string, number> = {};
  // We'll identify the lowest dimension from band score context
  if (band < 5.5) {
    const improvement_focus = `Your primary focus for the next attempt should be Task Achievement — make sure you directly answer every part of the question. Read the prompt twice before writing and underline the key instruction words (discuss, argue, evaluate). Many band 4–5 responses answer a related question, not the actual question asked.`;
    return {
      overall_tone: 'critical',
      opening_quality,
      argument_depth,
      vocabulary_note,
      structural_feedback,
      examiner_flag,
      improvement_focus,
    };
  } else if (band < 6.5) {
    const improvement_focus = `To move from band ${band} to 6.5+, focus on one thing: developing each idea fully before moving to the next. Most band 5–6 essays have the right ideas but not enough depth. The rule is: one idea per paragraph, expanded to 4–6 sentences with evidence, reasoning, and connection back to the thesis.`;
    return {
      overall_tone: 'mixed',
      opening_quality,
      argument_depth,
      vocabulary_note,
      structural_feedback,
      examiner_flag,
      improvement_focus,
    };
  } else {
    const improvement_focus = `You're at band ${band} — to push to 7+, the marginal gains come from precision. Review your response for: (1) hedging language ("it could be argued that..." rather than "it is obvious that..."), (2) cohesive devices at paragraph transitions, and (3) one more sophisticated vocabulary swap per paragraph.`;
    return {
      overall_tone: 'positive',
      opening_quality,
      argument_depth,
      vocabulary_note,
      structural_feedback,
      examiner_flag,
      improvement_focus,
    };
  }
}

// ─── ResponseCritiqueCard ─────────────────────────────────────────────────────

interface ResponseCritiqueCardProps {
  critique:  ResponseCritique;
  wordCount: number;
  bandScore: number | string;
}

const ResponseCritiqueCard = ({ critique, wordCount, bandScore }: ResponseCritiqueCardProps) => {
  const [expanded, setExpanded] = useState(false);

  const toneConfig = {
    positive: {
      icon:   <Smile className="w-5 h-5 text-emerald-500" />,
      label:  'Strong attempt',
      bg:     'bg-emerald-50 dark:bg-emerald-500/10',
      border: 'border-emerald-200 dark:border-emerald-500/30',
      badge:  'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400',
    },
    mixed: {
      icon:   <Meh className="w-5 h-5 text-amber-500" />,
      label:  'Needs development',
      bg:     'bg-amber-50 dark:bg-amber-500/10',
      border: 'border-amber-200 dark:border-amber-500/30',
      badge:  'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400',
    },
    critical: {
      icon:   <Frown className="w-5 h-5 text-rose-500" />,
      label:  'Significant gaps found',
      bg:     'bg-rose-50 dark:bg-rose-500/10',
      border: 'border-rose-200 dark:border-rose-500/30',
      badge:  'bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-400',
    },
  };

  const cfg = toneConfig[critique.overall_tone];

  const sections = [
    {
      icon:  <Quote className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />,
      label: 'Opening Analysis',
      text:  critique.opening_quality,
    },
    {
      icon:  <Target className="w-4 h-4 text-violet-500 shrink-0 mt-0.5" />,
      label: 'Argument Depth',
      text:  critique.argument_depth,
    },
    {
      icon:  <Sparkles className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />,
      label: 'Vocabulary & Register',
      text:  critique.vocabulary_note,
    },
    {
      icon:  <BarChart2 className="w-4 h-4 text-sky-500 shrink-0 mt-0.5" />,
      label: 'Structure & Cohesion',
      text:  critique.structural_feedback,
    },
  ];

  return (
    <Card className={`border ${cfg.border} ${cfg.bg} overflow-hidden`}>

      {/* Header */}
      <div className="px-6 py-4 border-b border-inherit flex items-center justify-between">
        <div className="flex items-center gap-3">
          {cfg.icon}
          <div>
            <p className="text-xs font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-0.5">
              Response Analysis
            </p>
            <h3 className="text-sm font-bold text-slate-800 dark:text-white">
              Based on your submitted essay
            </h3>
          </div>
        </div>
        <span className={`text-xs font-bold px-3 py-1 rounded-full ${cfg.badge}`}>
          {cfg.label}
        </span>
      </div>

      <div className="px-6 py-4 space-y-4">

        {/* Examiner flag — always visible if present */}
        {critique.examiner_flag && (
          <div className="flex items-start gap-3 bg-rose-100 dark:bg-rose-500/20 border border-rose-300 dark:border-rose-500/40 rounded-xl px-4 py-3">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <p className="text-sm text-rose-800 dark:text-rose-300 font-medium leading-relaxed">
              {critique.examiner_flag}
            </p>
          </div>
        )}

        {/* Preview — first section always visible */}
        <div className="flex items-start gap-3">
          {sections[0].icon}
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">
              {sections[0].label}
            </p>
            <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
              {sections[0].text}
            </p>
          </div>
        </div>

        {/* Expandable sections */}
        {expanded && (
          <div className="space-y-4 animate-in slide-in-from-top-2 duration-200">
            {sections.slice(1).map((s, i) => (
              <div key={i} className="flex items-start gap-3 pt-4 border-t border-slate-200 dark:border-slate-700/50">
                {s.icon}
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">
                    {s.label}
                  </p>
                  <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                    {s.text}
                  </p>
                </div>
              </div>
            ))}

            {/* Improvement focus */}
            <div className="pt-4 border-t border-slate-200 dark:border-slate-700/50">
              <div className="flex items-start gap-3 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/20 px-4 py-3">
                <TrendingUp className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-indigo-500 mb-1">
                    Priority for next attempt
                  </p>
                  <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                    {critique.improvement_focus}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Expand / collapse toggle */}
        <button
          onClick={() => setExpanded(v => !v)}
          className="w-full text-xs font-bold text-indigo-500 hover:text-indigo-600 dark:hover:text-indigo-400 py-2 flex items-center justify-center gap-1 transition-colors"
        >
          {expanded ? (
            <><X className="w-3.5 h-3.5" /> Show less</>
          ) : (
            <><Lightbulb className="w-3.5 h-3.5" /> See full analysis ({sections.length} areas + improvement plan)</>
          )}
        </button>
      </div>
    </Card>
  );
};

// ─── NudgeCard component ──────────────────────────────────────────────────────

interface NudgeCardProps {
  nudge:       NudgeResponse;
  onDismiss:   () => void;
  textareaRef: React.RefObject<HTMLTextAreaElement>;
}

const NudgeCard = ({ nudge, onDismiss, textareaRef }: NudgeCardProps) => {
  const handleContinue = () => {
    onDismiss();
    setTimeout(() => textareaRef.current?.focus(), 50);
  };

  return (
    <div className="mt-3 rounded-2xl border border-indigo-200 dark:border-indigo-500/30 bg-indigo-50 dark:bg-indigo-500/10 overflow-hidden animate-in slide-in-from-bottom-2 duration-300">
      <div className="flex items-center justify-between px-4 py-3 border-b border-indigo-200 dark:border-indigo-500/20">
        <div className="flex items-center gap-2">
          <Lightbulb className="w-4 h-4 text-indigo-500" />
          <span className="text-xs font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest">
            Writing Nudge
          </span>
        </div>
        <button onClick={handleContinue} className="text-indigo-400 hover:text-indigo-600 dark:hover:text-indigo-300 transition-colors" aria-label="Dismiss nudge">
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="p-4 space-y-3">
        <div className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">{nudge.nudge}</div>

        {nudge.sentence_frame && (
          <div className="rounded-xl bg-white dark:bg-slate-800 border border-indigo-100 dark:border-indigo-500/20 px-4 py-3">
            <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-1">Try this sentence frame</p>
            <p className="text-sm font-medium text-slate-700 dark:text-slate-200 italic">"{nudge.sentence_frame}"</p>
          </div>
        )}

        {nudge.punctuation_tip && (
          <div className="flex items-start gap-2 rounded-xl bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 px-4 py-3">
            <AlertCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
            <div>
              <p className="text-[10px] font-black text-amber-500 uppercase tracking-widest mb-0.5">Punctuation tip</p>
              <p className="text-sm text-amber-700 dark:text-amber-300">{nudge.punctuation_tip}</p>
            </div>
          </div>
        )}

        <div className="pt-1">
          <button onClick={handleContinue} className="w-full flex items-center justify-center gap-2 bg-indigo-500 hover:bg-indigo-600 text-white font-bold text-sm py-2.5 rounded-xl transition-all active:scale-[0.98]">
            Continue Writing <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Main component ───────────────────────────────────────────────────────────

export default function IeltsWriting() {
  const navigate       = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast }      = useToast();
  const { addPoints }  = useMomentum();

  const practiceMode = (searchParams.get('mode') ?? 'standalone') as 'gate' | 'standalone' | 'replay';
  const isGateMode   = practiceMode === 'gate';
  const isReplayMode = practiceMode === 'replay';

  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isSidebarHovered,   setIsSidebarHovered]   = useState(false);

  const [view,               setView]               = useState<ViewState>('library');
  const [assignments,        setAssignments]        = useState<WritingTask[]>([]);
  const [history,            setHistory]            = useState<WritingAssessmentHistoryItem[]>([]);
  const [isLoading,          setIsLoading]          = useState(true);
  const [selectedAssignment, setSelectedAssignment] = useState<WritingTask | null>(null);
  const [evaluationResult,   setEvaluationResult]   = useState<WritingAssessmentHistoryItem | null>(null);
  const [essayText,          setEssayText]          = useState('');
  const [submittedEssayText, setSubmittedEssayText] = useState(''); // snapshot at submit time
  const [submitting,         setSubmitting]         = useState(false);

  // ── Nudge state ──
  const [nudgeCount,     setNudgeCount]     = useState(0);
  const [nudgeLoading,   setNudgeLoading]   = useState(false);
  const [nudgeError,     setNudgeError]     = useState<string | null>(null);
  const [currentNudge,   setCurrentNudge]   = useState<NudgeResponse | null>(null);
  const [nudgeDismissed, setNudgeDismissed] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const targetWordCount = selectedAssignment?.title.includes('Task 1') ? 150 : 250;

  const wordCount = useMemo(() => {
    const trimmed = essayText.trim();
    return trimmed ? trimmed.split(/\s+/).length : 0;
  }, [essayText]);

  const submittedWordCount = useMemo(() => {
    const trimmed = submittedEssayText.trim();
    return trimmed ? trimmed.split(/\s+/).length : 0;
  }, [submittedEssayText]);

  const nudgesRemaining     = MAX_NUDGES - nudgeCount;
  const showNudgeButton     = wordCount >= NUDGE_MIN_WORDS && wordCount < targetWordCount;
  const nudgeButtonDisabled = nudgeLoading || nudgesRemaining === 0;

  useEffect(() => {
    setNudgeCount(0);
    setCurrentNudge(null);
    setNudgeError(null);
    setNudgeDismissed(false);
  }, [selectedAssignment]);

  useEffect(() => {
    if (nudgeDismissed && currentNudge) {
      setCurrentNudge(null);
      setNudgeDismissed(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [essayText]);

  const handleGetNudge = useCallback(async () => {
    if (!selectedAssignment || nudgeButtonDisabled) return;
    setNudgeLoading(true);
    setNudgeError(null);
    setCurrentNudge(null);
    await new Promise(resolve => setTimeout(resolve, 900));
    try {
      // ── TODO: swap for real API when Sarthak's endpoint is ready ──
      // const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:4000';
      // const res = await callBackend(`${backendUrl}/api/writing/nudge`, {
      //   method: 'POST',
      //   body: JSON.stringify({ topic: selectedAssignment.topic, student_text: essayText, word_count: wordCount, nudge_count: nudgeCount }),
      // });
      // if (res.nudge) { setCurrentNudge(res as NudgeResponse); setNudgeCount(prev => prev + 1); setNudgeDismissed(false); }
      // else { setNudgeError("Couldn't load feedback. Try again."); }
      const nudge = generateLocalNudge(selectedAssignment.topic, essayText, nudgeCount);
      setCurrentNudge(nudge);
      setNudgeCount(prev => prev + 1);
      setNudgeDismissed(false);
    } catch {
      setNudgeError("Couldn't load feedback. Try again.");
    } finally {
      setNudgeLoading(false);
    }
  }, [selectedAssignment, essayText, wordCount, nudgeCount, nudgeButtonDisabled]);

  useEffect(() => {
    const loadData = async () => {
      try {
        const tasks = await fetchWritingTasks();
        if (tasks) {
          setAssignments(tasks.map((task: any) => ({
            ...task,
            assignedDate: new Date(task.assignedDate).toISOString().split('T')[0],
          })));
        } else {
          setAssignments(MOCK_ASSIGNMENTS);
        }
        const hist = await fetchWritingHistory();
        if (hist) setHistory(hist);
      } catch (error) {
        console.error('Failed to fetch data:', error);
        setAssignments(MOCK_ASSIGNMENTS);
      } finally {
        setIsLoading(false);
      }
    };
    if (view === 'library' || view === 'history') loadData();
  }, [view]);

  const handleSelectAssignment = (assignment: WritingTask) => {
    setSelectedAssignment(assignment);
    setEssayText('');
    setSubmittedEssayText('');
    setView('writing');
  };

  const handleBack = () => {
    setSelectedAssignment(null);
    setEvaluationResult(null);
    setEssayText('');
    setSubmittedEssayText('');
    setView('library');
  };

  const handleGateContinue = () => {
    try {
      const today = new Date().toISOString().slice(0, 10);
      localStorage.setItem('skill_module_completed_today',
        JSON.stringify({ completed: true, date: today, skill: 'writing' }));
    } catch { }
    navigate('/student/dashboard', { state: { skillModuleCompleted: true } });
  };

  const handleSubmit = async () => {
    if (wordCount < targetWordCount) {
      toast({ title: 'Word count too low', description: `Please write at least ${targetWordCount} words before submitting.`, variant: 'destructive' });
      return;
    }
    setSubmitting(true);
    // Snapshot the essay text at submission time for critique generation
    setSubmittedEssayText(essayText);
    try {
      const result = await submitWritingSession(selectedAssignment!.id, essayText, wordCount);
      setEvaluationResult(result);
      addPoints(50, 'Completed Writing Module', isReplayMode ? 0.5 : 1.0);
      stampPassportSlot('writing');
      setView('results');
      toast({ title: 'Success!', description: 'Writing submitted successfully for analysis.' });
    } catch (error: any) {
      toast({ title: 'Error', description: error.message || 'Failed to submit analysis', variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-slate-950 transition-colors duration-300">
      <StudentSidebar
        activeTab="writing"
        isCollapsed={isSidebarCollapsed}
        toggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        onMouseEnter={() => setIsSidebarHovered(true)}
        onMouseLeave={() => setIsSidebarHovered(false)}
      />

      <div className={`transition-all duration-300 ease-in-out pl-0 ${isSidebarHovered ? 'md:pl-[288px]' : 'md:pl-[116px]'} flex flex-col min-h-screen`}>
        <StudentTopbar onUpgradeClick={() => {}} />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 w-full flex flex-col animate-in fade-in slide-in-from-bottom-4 duration-500">

          {/* ── VIEW 1: Library ─────────────────────────────────────────── */}
          {view === 'library' && (
            <div className="space-y-8 h-full">
              <div className="bg-[#7B61FF] rounded-2xl p-8 md:p-10 text-white shadow-md relative overflow-hidden">
                <div className="absolute top-0 right-0 -mt-4 -mr-4 w-32 h-32 bg-white opacity-10 rounded-full blur-2xl" />
                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div>
                    <h1 className="text-3xl font-bold mb-3 flex items-center gap-2">
                      IELTS Writing Analysis <Sparkles className="h-6 w-6 text-yellow-300" fill="currentColor" />
                    </h1>
                    <p className="text-indigo-50 max-w-2xl text-base md:text-lg leading-relaxed mb-6">
                      Master your writing skills with detailed, AI-powered feedback. Select a prompt below, aim for your target word count, and get instant insights on your grammar, vocabulary, and task coherence to push for a band 7+.
                    </p>
                  </div>
                  <Button variant="outline" className="bg-white/10 border-white/20 text-white hover:bg-white/20 whitespace-nowrap" onClick={() => setView('history')}>
                    <History className="w-4 h-4 mr-2" /> View History
                  </Button>
                </div>
              </div>

              {isLoading ? (
                <div className="flex justify-center items-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#7B61FF]" />
                </div>
              ) : assignments.length === 0 ? (
                <Card className="border-none shadow-sm bg-white dark:bg-slate-900 flex flex-col items-center justify-center p-12 text-center">
                  <BookOpen className="h-12 w-12 text-slate-300 dark:text-slate-600 mb-4" />
                  <CardTitle className="text-lg text-slate-700 dark:text-slate-200">No Assignments Yet</CardTitle>
                  <CardDescription className="dark:text-slate-400">Your instructor hasn't assigned any writing tasks currently.</CardDescription>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {assignments.map((assignment) => (
                    <Card key={assignment.id} onClick={() => handleSelectAssignment(assignment)} className="border border-slate-200 dark:border-slate-800 shadow-sm bg-white dark:bg-slate-900 hover:shadow-md hover:border-[#7B61FF] dark:hover:border-[#7B61FF] transition-all cursor-pointer flex flex-col h-64 group">
                      <CardHeader className="pb-3 flex-none">
                        <div className="flex justify-between items-start gap-4">
                          <CardTitle className="text-lg font-bold text-slate-800 dark:text-slate-100 group-hover:text-[#7B61FF] dark:group-hover:text-[#9b86ff] transition-colors line-clamp-2">{assignment.title}</CardTitle>
                          <Badge className="bg-indigo-50 text-[#7B61FF] hover:bg-indigo-100 dark:bg-[#7B61FF]/20 dark:text-[#9b86ff] flex-shrink-0">New</Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="flex flex-col flex-grow overflow-hidden pb-4">
                        <p className="text-slate-600 dark:text-slate-400 text-sm flex-grow line-clamp-4">{assignment.topic}</p>
                        <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center text-xs font-medium text-slate-500 dark:text-slate-500">
                          <span>Assigned: {assignment.assignedDate}</span>
                          <span className="text-[#7B61FF] dark:text-[#9b86ff] flex items-center group-hover:translate-x-1 transition-transform">Start Writing <ArrowLeft className="h-3 w-3 ml-1 rotate-180" /></span>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── VIEW 2: History ──────────────────────────────────────────── */}
          {view === 'history' && (
            <div className="space-y-8 h-full">
              <div className="flex items-center gap-4">
                <Button variant="ghost" onClick={() => setView('library')} className="text-slate-600 hover:bg-slate-100 -ml-2">
                  <ArrowLeft className="w-4 h-4 mr-2" /> Back to Assignments
                </Button>
                <h2 className="text-2xl font-bold dark:text-white">Past Analytics</h2>
              </div>
              {history.length === 0 && !isLoading ? (
                <Card className="p-8 text-center text-slate-500">No past writings found.</Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {history.map((item) => (
                    <Card key={item.id} className="cursor-pointer hover:border-[#7B61FF]" onClick={() => { setEvaluationResult(item); setSelectedAssignment(item.IeltsWritingTask || null); setView('results'); }}>
                      <CardHeader className="pb-2">
                        <CardTitle className="line-clamp-1">{item.IeltsWritingTask?.title || 'Unknown Task'}</CardTitle>
                        <CardDescription>{new Date(item.createdAt).toLocaleDateString()}</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="flex justify-between items-center text-sm">
                          <span className="font-semibold text-slate-700 dark:text-slate-200">Band Score:</span>
                          <Badge className="bg-[#7B61FF]">{item.aiBandScore}</Badge>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── VIEW 3: Writing Interface ────────────────────────────────── */}
          {view === 'writing' && selectedAssignment && (
            <div className="flex flex-col h-full flex-1 min-h-[calc(100vh-140px)]">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                <Button variant="ghost" onClick={handleBack} className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 -ml-2 w-fit">
                  <ArrowLeft className="w-4 h-4 mr-2" /> Back to Assignments
                </Button>
                {wordCount >= targetWordCount && (
                  <Button onClick={handleSubmit} disabled={submitting} className="bg-[#7B61FF] hover:bg-[#6a50e5] text-white shadow-sm w-full sm:w-auto">
                    {submitting ? (
                      <span className="flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Submitting...</span>
                    ) : (
                      <span className="flex items-center"><Send className="w-4 h-4 mr-2" /> Submit for Analysis</span>
                    )}
                  </Button>
                )}
              </div>

              <div className="flex flex-col lg:flex-row gap-6 flex-grow min-h-0">
                <div className="w-full lg:w-[40%] flex flex-col gap-6 overflow-y-auto pr-1">
                  <Card className="border-none shadow-sm bg-white dark:bg-slate-900 flex-shrink-0">
                    <CardHeader className="pb-4">
                      <div className="flex items-center gap-2 text-[#7B61FF] dark:text-[#9b86ff] mb-2">
                        <PenTool className="h-5 w-5" />
                        <span className="text-sm font-bold uppercase tracking-wider">Task Prompt</span>
                      </div>
                      <CardTitle className="text-xl text-slate-800 dark:text-white leading-tight">{selectedAssignment.title}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800 text-slate-700 dark:text-slate-300 text-sm leading-relaxed whitespace-pre-wrap">{selectedAssignment.topic}</div>
                    </CardContent>
                  </Card>

                  <Card className="border-none shadow-sm bg-amber-50 dark:bg-amber-900/10 border-amber-100 dark:border-amber-900/30 flex-shrink-0">
                    <CardContent className="p-5">
                      <h4 className="text-sm font-bold text-amber-800 dark:text-amber-500 mb-2">Instructions</h4>
                      <ul className="text-sm text-amber-700 dark:text-amber-400/80 list-disc list-inside space-y-1.5">
                        <li>Target length is at least <strong>{targetWordCount} words</strong>.</li>
                        <li>Include your own knowledge and experiences.</li>
                        <li>Review spelling and grammar before submitting.</li>
                      </ul>
                    </CardContent>
                  </Card>
                </div>

                <div className="w-full lg:w-[60%] flex flex-col">
                  <Card className="border border-slate-200 dark:border-slate-800 shadow-sm bg-white dark:bg-slate-900 flex flex-col overflow-hidden flex-grow">
                    <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/50">
                      <h3 className="font-semibold text-slate-700 dark:text-slate-200 text-sm">Your Response</h3>
                      <Badge variant="secondary" className={`font-medium ${wordCount >= targetWordCount ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : wordCount >= NUDGE_MIN_WORDS ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400' : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'}`}>
                        {wordCount} / {targetWordCount} words
                      </Badge>
                    </div>

                    <textarea
                      ref={textareaRef}
                      value={essayText}
                      onChange={(e) => setEssayText(e.target.value)}
                      placeholder="Start typing your essay here..."
                      className="flex-grow w-full p-6 resize-none bg-transparent focus:outline-none focus:ring-0 text-slate-800 dark:text-slate-200 leading-relaxed custom-scrollbar placeholder:text-slate-400 dark:placeholder:text-slate-600"
                      spellCheck={false}
                    />

                    <div className="px-4 py-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex items-center justify-between gap-3 flex-wrap">
                      <div className="flex items-center gap-2">
                        {wordCount >= targetWordCount ? (
                          <span className="text-xs text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5" /> Target reached — ready to submit</span>
                        ) : nudgesRemaining === 0 ? (
                          <span className="text-xs text-slate-400 dark:text-slate-500 font-medium">No nudges left</span>
                        ) : (
                          <span className="text-xs text-slate-400 dark:text-slate-500 font-medium">{nudgesRemaining} nudge{nudgesRemaining !== 1 ? 's' : ''} remaining</span>
                        )}
                      </div>

                      {wordCount < targetWordCount && (
                        <div className="flex flex-col items-end gap-1">
                          <button
                            onClick={handleGetNudge}
                            disabled={nudgeButtonDisabled || wordCount < NUDGE_MIN_WORDS}
                            className={`flex items-center gap-2 text-sm font-bold py-2 px-4 rounded-xl transition-all ${nudgeButtonDisabled || wordCount < NUDGE_MIN_WORDS ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 cursor-not-allowed' : 'bg-indigo-500 hover:bg-indigo-600 text-white shadow-sm active:scale-[0.98]'}`}
                          >
                            {nudgeLoading ? <><Loader2 className="w-4 h-4 animate-spin" /> Getting feedback...</> : nudgesRemaining === 0 ? <><MessageSquarePlus className="w-4 h-4" /> No nudges left</> : <><MessageSquarePlus className="w-4 h-4" /> Get Feedback</>}
                          </button>
                          {wordCount < NUDGE_MIN_WORDS && (
                            <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">Type at least {NUDGE_MIN_WORDS} words</span>
                          )}
                        </div>
                      )}
                    </div>
                  </Card>

                  {nudgeError && (
                    <div className="mt-2 flex items-center gap-2 text-sm text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 px-4 py-3 rounded-xl animate-in slide-in-from-bottom-1">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      {nudgeError}
                      <button onClick={handleGetNudge} className="ml-auto text-xs font-bold text-rose-600 dark:text-rose-400 underline underline-offset-2 hover:no-underline">Try again</button>
                    </div>
                  )}

                  {currentNudge && !nudgeDismissed && (
                    <NudgeCard nudge={currentNudge} onDismiss={() => setNudgeDismissed(true)} textareaRef={textareaRef} />
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ── VIEW 4: Results ──────────────────────────────────────────── */}
          {view === 'results' && evaluationResult && (
            <div className="space-y-6 max-w-4xl mx-auto h-full overflow-y-auto pb-12">
              <Button variant="ghost" onClick={handleBack} className="text-slate-600 hover:bg-slate-100 -ml-2">
                <ArrowLeft className="w-4 h-4 mr-2" /> Back
              </Button>

              {/* Band score hero */}
              <div className="bg-gradient-to-br from-[#7B61FF] to-[#5B41DF] rounded-3xl p-8 text-white text-center relative overflow-hidden shadow-xl">
                <div className="relative z-10">
                  <div className="w-20 h-20 rounded-full bg-white/10 flex items-center justify-center mx-auto mb-4 border-2 border-white/20">
                    <CheckCircle className="w-10 h-10 text-emerald-300" />
                  </div>
                  <p className="text-indigo-100 text-sm font-bold uppercase tracking-widest mb-1">Overall Band Score</p>
                  <div className="text-7xl font-black mb-3">{evaluationResult.aiBandScore}</div>
                </div>
              </div>

              {/* Gate CTA */}
              {isGateMode && (
                <div className="bg-indigo-50 border border-indigo-200 rounded-2xl p-5 flex flex-col items-center justify-center text-center">
                  <CheckCircle2 className="w-8 h-8 text-indigo-500 mb-2" />
                  <p className="text-indigo-900 font-bold mb-4">Practice complete — your drills are now unlocked</p>
                  <button onClick={handleGateContinue} className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-8 rounded-xl transition-all shadow-md active:scale-95 flex items-center gap-2">
                    Continue to Drills <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              )}

              {/* Criterion scores */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card className="text-center p-4"><p className="text-xs font-bold text-slate-400 uppercase">Grammar</p><p className="text-2xl font-black text-[#7B61FF]">{evaluationResult.aiGrammarScore}</p></Card>
                <Card className="text-center p-4"><p className="text-xs font-bold text-slate-400 uppercase">Vocabulary</p><p className="text-2xl font-black text-[#7B61FF]">{evaluationResult.aiVocabularyScore}</p></Card>
                <Card className="text-center p-4"><p className="text-xs font-bold text-slate-400 uppercase">Coherence</p><p className="text-2xl font-black text-[#7B61FF]">{evaluationResult.aiCoherenceScore}</p></Card>
                <Card className="text-center p-4"><p className="text-xs font-bold text-slate-400 uppercase">Task Response</p><p className="text-2xl font-black text-[#7B61FF]">{evaluationResult.aiTaskResponseScore}</p></Card>
              </div>

              {/* ── RESPONSE CRITIQUE CARD ─────────────────────────────── */}
              {/* Only show if we have the submitted essay text (fresh submission).
                  For history view, submittedEssayText will be empty, so this hides gracefully. */}
              {submittedEssayText && (
                <ResponseCritiqueCard
                  critique={generateResponseCritique(
                    submittedEssayText,
                    submittedWordCount,
                    evaluationResult.aiBandScore,
                  )}
                  wordCount={submittedWordCount}
                  bandScore={evaluationResult.aiBandScore}
                />
              )}

              {/* Coach feedback */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <BarChart2 className="w-5 h-5 text-[#7B61FF]" /> Coach Feedback
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 text-sm text-slate-700 dark:text-slate-300">
                  <div>
                    <h4 className="font-bold text-slate-800 dark:text-white mb-2">Grammar Fixes:</h4>
                    <ul className="list-disc pl-5 space-y-1">
                      {evaluationResult.aiFeedbackData?.grammar?.map((g: string, i: number) => <li key={i}>{g}</li>) || <li>No major grammar issues detected.</li>}
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-800 dark:text-white mb-2">Vocabulary Improvements:</h4>
                    <ul className="list-disc pl-5 space-y-1">
                      {evaluationResult.aiFeedbackData?.vocabulary?.map((v: string, i: number) => <li key={i}>{v}</li>) || <li>Vocabulary was strong.</li>}
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-800 dark:text-white mb-2">Overall Guidance:</h4>
                    <p>{evaluationResult.aiFeedbackData?.improvements || 'Keep practicing.'}</p>
                  </div>
                </CardContent>
              </Card>

              {evaluationResult.manualBandScore && (
                <Card className="border-emerald-200 bg-emerald-50 dark:bg-emerald-900/10">
                  <CardHeader>
                    <CardTitle className="text-emerald-700 flex items-center gap-2">Instructor Review</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p><strong>Band Grade Updated To:</strong> {evaluationResult.manualBandScore}</p>
                    <p className="mt-2 text-sm text-emerald-800">{evaluationResult.manualFeedback}</p>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

        </main>
      </div>
    </div>
  );
}