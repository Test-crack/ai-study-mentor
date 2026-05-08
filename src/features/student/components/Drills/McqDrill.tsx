import React, { useState, useEffect } from 'react';
import { Button } from '@/shared/components/ui/button';
import { CheckCircle2, XCircle, ChevronRight, HelpCircle, Eye, AlertTriangle, Search } from 'lucide-react';

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
          className="bg-amber-200 dark:bg-amber-500/30 text-amber-900 dark:text-amber-200 font-black px-1 rounded-sm not-italic"
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

// ─── TYPES ────────────────────────────────────────────────────────────────────

export interface McqPrompt {
  id: string;
  prompt_text: string;
  options: Record<string, string>;
  correct_answer: string;
  explanation: string | null;
  // Optional per-option explanations from backend.
  // If not present, we fall back to the single explanation field.
  option_explanations?: Record<string, string>;
}

interface McqDrillProps {
  prompt: McqPrompt;
  onComplete: (pointsEarned: number, usedTrapPhase: boolean) => void;
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
    onComplete(isCorrect ? 10 : 2, true);
    setSelectedOption(null);
    setHasChecked(false);
    setIsCorrect(false);
    setPhase('question');
    setStudentConfirmed(false);
  };

  // ─── Explanation helpers ───────────────────────────────────────────────────
  // Returns the explanation for a specific option key if available,
  // otherwise falls back to the general explanation field.
  const getOptionExplanation = (key: string): string | null => {
    if (prompt.option_explanations && prompt.option_explanations[key]) {
      return prompt.option_explanations[key];
    }
    return null;
  };

  // The explanation shown for the WRONG selected answer
  const wrongAnswerExplanation = selectedOption
    ? getOptionExplanation(selectedOption) ?? `Option ${selectedOption} is incorrect.`
    : null;

  // The explanation shown for the CORRECT answer
  const correctAnswerExplanation =
    getOptionExplanation(correctAnswerKey) ?? prompt.explanation ?? null;

  // ─────────────────────────────────────────────────────────────────────────
  // PHASE 1 — QUESTION PREVIEW
  // ─────────────────────────────────────────────────────────────────────────

  if (phase === 'question') {
    return (
      <div className="flex flex-col h-full animate-in fade-in duration-300">

        <div className="flex items-center gap-2 mb-5">
          <div className="flex items-center gap-1.5 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 px-3 py-1.5 rounded-full">
            <Search className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
            <span className="text-xs font-black text-amber-700 dark:text-amber-400 uppercase tracking-widest">
              Step 1 — Read the Question
            </span>
          </div>
        </div>

        <div className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl p-6 mb-5">
          <p className="text-xl sm:text-2xl font-bold text-slate-800 dark:text-white leading-relaxed">
            {trapResult.highlighted}
          </p>
        </div>

        {trapResult.hasTrapWords ? (
          <div className="flex items-start gap-3 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 rounded-2xl p-4 mb-5 animate-in fade-in duration-300">
            <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-black text-amber-800 dark:text-amber-300 mb-1">
                Trap word{trapResult.foundWords.length > 1 ? 's' : ''} detected
              </p>
              <p className="text-sm text-amber-700/80 dark:text-amber-400/80 leading-relaxed">
                This question contains the trap word{trapResult.foundWords.length > 1 ? 's' : ''}{' '}
                {trapResult.foundWords.map((w, i) => (
                  <span key={w}>
                    <strong className="font-black">{w}</strong>
                    {i < trapResult.foundWords.length - 1 ? ' and ' : ''}
                  </span>
                ))}.{' '}
                Trap words like these invert or restrict the meaning of a question.
                Students who miss them almost always choose the wrong option even when they know the content.
                Re-read the question with{' '}
                {trapResult.foundWords.map((w, i) => (
                  <span key={w}>
                    <strong className="font-black">{w}</strong>
                    {i < trapResult.foundWords.length - 1 ? ' and ' : ''}
                  </span>
                ))}{' '}
                in mind before selecting your answer.
              </p>
            </div>
          </div>
        ) : (
          <div className="flex items-start gap-3 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 rounded-2xl p-4 mb-5">
            <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
            <p className="text-sm font-medium text-emerald-800 dark:text-emerald-300">
              No trap words detected. Read carefully and proceed when ready.
            </p>
          </div>
        )}

        <p className="text-sm text-slate-500 dark:text-slate-400 font-medium mb-6">
          Understand what the question is asking before looking at the options. What is the key thing you are looking for?
        </p>

        <div className="mt-auto pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end">
          <Button
            onClick={handleConfirmQuestion}
            className="bg-[#7B61FF] hover:bg-[#6A52E5] text-white px-8 py-6 rounded-xl font-bold text-lg shadow-md transition-all"
          >
            <Eye className="w-5 h-5 mr-2" />
            I understand — Show Options
          </Button>
        </div>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // PHASE 2 — ANSWER PHASE
  // ─────────────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col h-full animate-in fade-in duration-300">

      {/* Phase indicator + trap word reminder */}
      <div className="flex items-center gap-2 mb-5 flex-wrap">
        <div className="flex items-center gap-1.5 bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/20 px-3 py-1.5 rounded-full">
          <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
          <span className="text-xs font-black text-indigo-700 dark:text-indigo-400 uppercase tracking-widest">
            Step 2 — Select Your Answer
          </span>
        </div>
        {trapResult.hasTrapWords && (
          <div className="flex items-center gap-1.5 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 px-3 py-1.5 rounded-full">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
            <span className="text-xs font-bold text-amber-700 dark:text-amber-400">
              Trap: {trapResult.foundWords.join(', ')}
            </span>
          </div>
        )}
      </div>

      {/* Question — with trap word highlights as a reminder */}
      <div className="mb-6">
        <h2 className="text-xl sm:text-2xl font-bold text-slate-800 dark:text-white leading-relaxed">
          {trapResult.highlighted}
        </h2>
      </div>

      {/* Options */}
      <div className="flex-1 overflow-y-auto space-y-3 mb-8">
        {Object.entries(prompt.options || {}).map(([key, text]) => {

          let stateStyles = 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-[#7B61FF] hover:bg-slate-50 dark:hover:bg-slate-800/80';
          let icon = null;

          if (hasChecked) {
            if (key === correctAnswerKey) {
              stateStyles = 'border-emerald-500 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-800 dark:text-emerald-200';
              icon = <CheckCircle2 className="w-5 h-5 text-emerald-500" />;
            } else if (key === selectedOption) {
              stateStyles = 'border-rose-500 bg-rose-50 dark:bg-rose-500/10 text-rose-800 dark:text-rose-200 opacity-70';
              icon = <XCircle className="w-5 h-5 text-rose-500" />;
            } else {
              stateStyles = 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 opacity-50';
            }
          } else if (key === selectedOption) {
            stateStyles = 'border-[#7B61FF] ring-1 ring-[#7B61FF] bg-indigo-50 dark:bg-[#7B61FF]/10 text-[#7B61FF] dark:text-white';
          }

          return (
            <button
              key={key}
              onClick={() => !hasChecked && setSelectedOption(key)}
              disabled={hasChecked}
              className={`w-full text-left p-4 rounded-xl border-2 transition-all duration-200 flex items-center justify-between ${stateStyles}`}
            >
              <div className="flex items-center gap-4">
                <span className={`w-8 h-8 flex items-center justify-center rounded-lg font-bold text-sm ${
                  key === selectedOption && !hasChecked
                    ? 'bg-[#7B61FF] text-white'
                    : hasChecked && key === correctAnswerKey
                    ? 'bg-emerald-500 text-white'
                    : hasChecked && key === selectedOption
                    ? 'bg-rose-500 text-white'
                    : 'bg-slate-100 dark:bg-slate-700 text-slate-500'
                }`}>
                  {key}
                </span>
                <span className="font-medium text-base sm:text-lg">{text}</span>
              </div>
              {icon}
            </button>
          );
        })}
      </div>

      {/* ── FEEDBACK SECTION ─────────────────────────────────────────────────
          CORRECT answer → single explanation block (as before).
          WRONG answer   → two blocks:
                           1. Why your selected answer is wrong
                           2. Why the correct answer is right
          Trap word reminder appended when relevant.
      ── */}
      {hasChecked && (
        <div className="mb-6 space-y-3 animate-in fade-in slide-in-from-bottom-2">

          {isCorrect ? (
            /* ── Correct — single explanation block, unchanged behaviour ── */
            <div className="p-4 rounded-xl flex gap-3 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-800 dark:text-emerald-200 border border-emerald-100 dark:border-emerald-500/20">
              <HelpCircle className="w-6 h-6 shrink-0 mt-0.5 text-emerald-500" />
              <div>
                <span className="font-bold block mb-1">Excellent!</span>
                {correctAnswerExplanation && (
                  <span className="text-sm opacity-90">{correctAnswerExplanation}</span>
                )}
              </div>
            </div>
          ) : (
            <>
              {/* Block 1 — Why the selected answer is WRONG */}
              <div className="p-4 rounded-xl flex gap-3 bg-rose-50 dark:bg-rose-500/10 text-rose-800 dark:text-rose-200 border border-rose-100 dark:border-rose-500/20">
                <XCircle className="w-6 h-6 shrink-0 mt-0.5 text-rose-500" />
                <div>
                  <span className="font-bold block mb-1">
                    Why option {selectedOption} is wrong
                  </span>
                  <span className="text-sm opacity-90">
                    {wrongAnswerExplanation}
                  </span>
                  {/* Trap word callout on wrong answer — uses the word "trap" explicitly */}
                  {trapResult.hasTrapWords && (
                    <p className="text-sm font-bold mt-2 opacity-90">
                      This question contained the trap word{trapResult.foundWords.length > 1 ? 's' : ''}{' '}
                      <strong>
                        {trapResult.foundWords.map((w, i) => (
                          <span key={w}>
                            {w}{i < trapResult.foundWords.length - 1 ? ' and ' : ''}
                          </span>
                        ))}
                      </strong>
                      {'. '}
                      Trap words like{' '}
                      {trapResult.foundWords.map((w, i) => (
                        <span key={w}>
                          <strong>{w}</strong>
                          {i < trapResult.foundWords.length - 1 ? ' and ' : ''}
                        </span>
                      ))}{' '}
                      change what the question is asking. Always re-read the question with the trap word in focus before selecting your answer.
                    </p>
                  )}
                </div>
              </div>

              {/* Block 2 — Why the correct answer is RIGHT */}
              {correctAnswerExplanation && (
                <div className="p-4 rounded-xl flex gap-3 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-800 dark:text-emerald-200 border border-emerald-100 dark:border-emerald-500/20">
                  <CheckCircle2 className="w-6 h-6 shrink-0 mt-0.5 text-emerald-500" />
                  <div>
                    <span className="font-bold block mb-1">
                      Why option {correctAnswerKey} is correct
                    </span>
                    <span className="text-sm opacity-90">{correctAnswerExplanation}</span>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Action buttons */}
      <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end">
        {!hasChecked ? (
          <Button
            onClick={handleCheck}
            disabled={!selectedOption}
            className="bg-[#7B61FF] hover:bg-[#6A52E5] text-white px-8 py-6 rounded-xl font-bold text-lg shadow-md transition-all disabled:opacity-50"
          >
            Check Answer
          </Button>
        ) : (
          <Button
            onClick={handleNext}
            className="bg-slate-800 hover:bg-slate-900 dark:bg-white dark:hover:bg-slate-100 dark:text-slate-900 text-white px-8 py-6 rounded-xl font-bold text-lg shadow-md transition-all"
          >
            Next <ChevronRight className="w-5 h-5 ml-1" />
          </Button>
        )}
      </div>
    </div>
  );
}