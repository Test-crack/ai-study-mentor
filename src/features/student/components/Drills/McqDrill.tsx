// src/features/student/drills/McqDrill.tsx
import React, { useState, useEffect } from 'react';
import { Button } from '@/shared/components/ui/button';
import { CheckCircle2, XCircle, ChevronRight, Eye, AlertTriangle, Search, Lightbulb } from 'lucide-react';

// ─── TRAP WORD DETECTION ─────────────────────────────────────────────────────

const TRAP_WORDS = [
  'NOT', 'EXCEPT', 'ONLY', 'ALWAYS', 'NEVER', 'LEAST', 'MOST',
  'BEST', 'WORST', 'ALL', 'NONE', 'EVERY', 'UNLESS', 'WITHOUT',
  'INCORRECT', 'FALSE', 'UNTRUE', 'OPPOSITE', 'NEITHER', 'NOR',
];

interface TrapWordResult {
  hasTrapWords: boolean;
  foundWords: string[];
  highlighted: React.ReactNode[];
}

const detectTrapWords = (text: string): TrapWordResult => {
  const foundWords: string[] = [];
  const tokens = text.split(/(\s+)/);

  const highlighted = tokens.map((token, index) => {
    const clean = token.replace(/[^a-zA-Z]/g, '').toUpperCase();
    if (TRAP_WORDS.includes(clean)) {
      foundWords.push(clean);
      return (
        <mark
          key={index}
          className="bg-amber-200 text-amber-900 font-bold px-1 rounded-sm not-italic"
          title={`Trap word: "${clean}" — read this carefully`}
        >
          {token}
        </mark>
      );
    }
    return <span key={index}>{token}</span>;
  });

  return {
    hasTrapWords: foundWords.length > 0,
    foundWords: [...new Set(foundWords)],
    highlighted,
  };
};

/** Renders a list of trap words as bolded, comma/and-joined inline text. */
const TrapWordList = ({ words }: { words: string[] }) => (
  <>
    {words.map((w, i) => (
      <span key={w}>
        <strong className="font-bold">{w}</strong>
        {i < words.length - 1 ? (i === words.length - 2 ? ' and ' : ', ') : ''}
      </span>
    ))}
  </>
);

// ─── TYPES ────────────────────────────────────────────────────────────────────

export interface McqPrompt {
  id: string;
  prompt_text: string;
  options: Record<string, string>;
  correct_answer: string;
  /** The single explanation stored in drill_questions.explanation. */
  explanation: string | null;
}

export interface McqDrillResult {
  points: number;
  questionId: string;
  selectedAnswer: string;
}

interface McqDrillProps {
  prompt: McqPrompt;
  onComplete: (result: McqDrillResult) => void;
}

// ─── COMPONENT ────────────────────────────────────────────────────────────────

export default function McqDrill({ prompt, onComplete }: McqDrillProps) {

  const [phase, setPhase]                   = useState<'question' | 'answer'>('question');
  const [trapResult, setTrapResult]         = useState<TrapWordResult>({ hasTrapWords: false, foundWords: [], highlighted: [] });
  const [studentConfirmed, setStudentConfirmed] = useState(false);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [hasChecked, setHasChecked]         = useState(false);
  const [isCorrect, setIsCorrect]           = useState(false);

  useEffect(() => {
    setTrapResult(detectTrapWords(prompt.prompt_text));
    setPhase('question');
    setStudentConfirmed(false);
    setSelectedOption(null);
    setHasChecked(false);
    setIsCorrect(false);
  }, [prompt.id]);

  const getCorrectAnswerKey = () => {
    try {
      if (typeof prompt.correct_answer === 'string') {
        const parsed = JSON.parse(prompt.correct_answer);
        return typeof parsed === 'string' ? parsed : prompt.correct_answer;
      }
      return String(prompt.correct_answer);
    } catch {
      return prompt.correct_answer;
    }
  };

  const correctAnswerKey = getCorrectAnswerKey().replace(/['"]/g, '');

  const handleConfirmQuestion = () => {
    setStudentConfirmed(true);
    setPhase('answer');
  };

  const handleCheck = () => {
    if (!selectedOption) return;
    setIsCorrect(selectedOption === correctAnswerKey);
    setHasChecked(true);
  };

  const handleNext = () => {
    const points = isCorrect ? 10 : 2;
    const answer = selectedOption ?? '';
    setSelectedOption(null);
    setHasChecked(false);
    setIsCorrect(false);
    onComplete({ points, questionId: prompt.id, selectedAnswer: answer });
  };

  /**
   * The one explanation we actually store (drill_questions.explanation).
   * There is no per-option explanation column, so this is the single source
   * shown for both correct and incorrect answers.
   */
  const explanation = prompt.explanation ?? null;

  // Shared shells — keep both phases visually consistent and responsive.
  const cardBase =
    'rounded-2xl border bg-white border-brand-line';
  const chip =
    'font-jetbrains inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-full text-[10px] sm:text-[11px] font-bold uppercase tracking-wider';

  // ─────────────────────────────────────────────────────────────────────────
  // PHASE 1 — QUESTION PREVIEW
  // ─────────────────────────────────────────────────────────────────────────

  if (phase === 'question') {
    return (
      <div className="flex flex-col animate-in fade-in duration-300">

        <div className="mb-4 sm:mb-5">
          <span className={`${chip} bg-amber-50 border border-amber-200 text-amber-700`}>
            <Search className="w-3.5 h-3.5 shrink-0" />
            <span>Step 1 — Read the question</span>
          </span>
        </div>

        <div className={`${cardBase} p-4 sm:p-6 mb-4 sm:mb-5`}>
          <p className="text-lg sm:text-xl md:text-2xl font-semibold text-brand-text leading-relaxed break-words">
            {trapResult.highlighted}
          </p>
        </div>

        {trapResult.hasTrapWords ? (
          <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-4 sm:mb-5 animate-in fade-in duration-300">
            <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
            <div className="min-w-0">
              <p className="text-sm font-bold text-amber-800 mb-1">
                Trap word{trapResult.foundWords.length > 1 ? 's' : ''} detected
              </p>
              <p className="text-sm text-amber-700/90 leading-relaxed">
                This question contains <TrapWordList words={trapResult.foundWords} />. Trap words invert or
                restrict what is being asked — students who miss them often pick the wrong option even when
                they know the content. Re-read the question with them in mind before answering.
              </p>
            </div>
          </div>
        ) : (
          <div className="flex items-start gap-3 bg-emerald-50 border border-emerald-200 rounded-2xl p-4 mb-4 sm:mb-5">
            <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
            <p className="text-sm font-medium text-emerald-800">
              No trap words detected. Read carefully and proceed when ready.
            </p>
          </div>
        )}

        <p className="text-sm text-brand-text-mute mb-6">
          Work out what the question is actually asking before you look at the options.
        </p>

        <div className="pt-4 border-t border-brand-line flex sm:justify-end">
          <Button
            onClick={handleConfirmQuestion}
            className="w-full sm:w-auto bg-brand-teal-600 hover:bg-brand-teal-700 text-white px-6 sm:px-8 h-12 sm:h-14 rounded-xl font-bold text-sm sm:text-base shadow-sm transition-colors"
          >
            <Eye className="w-5 h-5 mr-2 shrink-0" />
            I understand — show options
          </Button>
        </div>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // PHASE 2 — ANSWER PHASE
  // ─────────────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col animate-in fade-in duration-300">

      {/* Phase indicator + trap word reminder */}
      <div className="flex flex-wrap items-center gap-2 mb-4 sm:mb-5">
        <span className={`${chip} bg-brand-teal-50 border border-brand-teal-200 text-brand-teal-700`}>
          <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
          <span>Step 2 — Select your answer</span>
        </span>
        {trapResult.hasTrapWords && (
          <span className={`${chip} bg-amber-50 border border-amber-200 text-amber-700`}>
            <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
            <span className="normal-case tracking-normal font-semibold">
              Trap: {trapResult.foundWords.join(', ')}
            </span>
          </span>
        )}
      </div>

      {/* Question — trap highlights retained as a reminder */}
      <h2 className="text-lg sm:text-xl md:text-2xl font-semibold text-brand-text leading-relaxed break-words mb-5 sm:mb-6">
        {trapResult.highlighted}
      </h2>

      {/* Options */}
      <div
        role="radiogroup"
        aria-label="Answer options"
        className="space-y-2.5 sm:space-y-3 mb-6"
      >
        {Object.entries(prompt.options || {}).map(([key, text]) => {

          const isThisSelected = key === selectedOption;
          const isThisCorrect  = key === correctAnswerKey;

          let stateStyles =
            'border-brand-line bg-white hover:border-brand-teal-300 hover:bg-brand-bg-alt active:scale-[0.995]';
          let badgeStyles = 'bg-brand-bg-alt text-brand-text-mute';
          let icon: React.ReactNode = null;

          if (hasChecked) {
            if (isThisCorrect) {
              stateStyles = 'border-emerald-500 bg-emerald-50 text-emerald-900';
              badgeStyles = 'bg-emerald-500 text-white';
              icon = <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />;
            } else if (isThisSelected) {
              stateStyles = 'border-rose-400 bg-rose-50 text-rose-900';
              badgeStyles = 'bg-rose-500 text-white';
              icon = <XCircle className="w-5 h-5 text-rose-500 shrink-0" />;
            } else {
              stateStyles = 'border-brand-line bg-brand-bg-alt/60 opacity-55';
            }
          } else if (isThisSelected) {
            stateStyles = 'border-brand-teal-500 ring-2 ring-brand-teal-500/25 bg-brand-teal-50 text-brand-teal-800';
            badgeStyles = 'bg-brand-teal-600 text-white';
          }

          return (
            <button
              key={key}
              type="button"
              role="radio"
              aria-checked={isThisSelected}
              onClick={() => !hasChecked && setSelectedOption(key)}
              disabled={hasChecked}
              className={`w-full text-left min-h-[60px] sm:min-h-[64px] p-3.5 sm:p-4 rounded-xl border-2 transition-all duration-150 flex items-center gap-3 sm:gap-4 disabled:cursor-default ${stateStyles}`}
            >
              <span className={`w-8 h-8 sm:w-9 sm:h-9 grid place-items-center rounded-lg font-bold text-sm shrink-0 transition-colors ${badgeStyles}`}>
                {key}
              </span>
              <span className="flex-1 font-medium text-[15px] sm:text-base md:text-lg leading-snug break-words">
                {text}
              </span>
              {icon}
            </button>
          );
        })}
      </div>

      {/* ── FEEDBACK — one explanation only (the single stored value) ── */}
      {hasChecked && (
        <div
          role="status"
          aria-live="polite"
          className={`rounded-2xl border p-4 sm:p-5 mb-6 animate-in fade-in slide-in-from-bottom-2 ${
            isCorrect
              ? 'bg-emerald-50 border-emerald-200'
              : 'bg-brand-bg-alt border-brand-line'
          }`}
        >
          <div className="flex items-start gap-3">
            {isCorrect
              ? <CheckCircle2 className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-500 shrink-0 mt-0.5" />
              : <Lightbulb className="w-5 h-5 sm:w-6 sm:h-6 text-brand-teal-500 shrink-0 mt-0.5" />}

            <div className="min-w-0 flex-1">
              <p className={`font-bold text-sm sm:text-base mb-1 ${
                isCorrect
                  ? 'text-emerald-800'
                  : 'text-brand-text'
              }`}>
                {isCorrect ? 'Correct' : `Not quite — the answer is ${correctAnswerKey}`}
              </p>

              {explanation && (
                <p className={`text-sm leading-relaxed break-words ${
                  isCorrect
                    ? 'text-emerald-800/90'
                    : 'text-brand-text-mute'
                }`}>
                  {explanation}
                </p>
              )}

              {/* Trap-word coaching, folded into the single feedback card */}
              {trapResult.hasTrapWords && (
                <div className="mt-3 pt-3 border-t border-amber-200/70 flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                  <p className="text-sm text-amber-800 leading-relaxed">
                    This question contained <TrapWordList words={trapResult.foundWords} />. Trap words change
                    what the question is asking — always re-read with them in focus before selecting.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Action bar — sticks to the bottom of the viewport on small screens */}
      <div className="sticky bottom-0 -mx-6 sm:mx-0 px-6 sm:px-0 py-3 sm:py-0 sm:pt-4 bg-brand-bg/95 sm:bg-transparent backdrop-blur-sm sm:backdrop-blur-none border-t border-brand-line sm:border-brand-line flex sm:justify-end">
        {!hasChecked ? (
          <Button
            onClick={handleCheck}
            disabled={!selectedOption}
            className="w-full sm:w-auto bg-brand-teal-600 hover:bg-brand-teal-700 text-white px-6 sm:px-8 h-12 sm:h-14 rounded-xl font-bold text-sm sm:text-base shadow-sm transition-colors disabled:opacity-50"
          >
            Check answer
          </Button>
        ) : (
          <Button
            onClick={handleNext}
            className="w-full sm:w-auto bg-brand-ink-deep hover:bg-brand-ink text-white px-6 sm:px-8 h-12 sm:h-14 rounded-xl font-bold text-sm sm:text-base shadow-sm transition-colors"
          >
            Next <ChevronRight className="w-5 h-5 ml-1 shrink-0" />
          </Button>
        )}
      </div>
    </div>
  );
}
