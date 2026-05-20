import React, { useState } from 'react';
import { Button } from '@/shared/components/ui/button';
import { CheckCircle2, XCircle, ChevronRight, HelpCircle } from 'lucide-react';

export interface McqPrompt {
  id: string;
  prompt_text: string;
  options: Record<string, string>;
  correct_answer: string;
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

export default function McqDrill({ prompt, onComplete }: McqDrillProps) {
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [hasChecked, setHasChecked] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);

  // Parse correct answer, handling JSON wrapper if it comes as "\"B\""
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

  const handleCheck = () => {
    if (!selectedOption) return;
    
    const correct = selectedOption === correctAnswerKey;
    setIsCorrect(correct);
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

  return (
    <div className="flex flex-col h-full animate-in fade-in duration-300">
      <div className="mb-8">
        <h2 className="text-xl sm:text-2xl font-bold text-slate-800 dark:text-white leading-relaxed">
          {prompt.prompt_text}
        </h2>
      </div>

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

      {hasChecked && prompt.explanation && (
        <div className={`p-4 rounded-xl mb-6 flex gap-3 animate-in fade-in slide-in-from-bottom-2 ${isCorrect ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-800 dark:text-emerald-200 border border-emerald-100 dark:border-emerald-500/20' : 'bg-rose-50 dark:bg-rose-500/10 text-rose-800 dark:text-rose-200 border border-rose-100 dark:border-rose-500/20'}`}>
          <HelpCircle className={`w-6 h-6 shrink-0 mt-0.5 ${isCorrect ? 'text-emerald-500' : 'text-rose-500'}`} />
          <div>
            <span className="font-bold block mb-1">{isCorrect ? 'Excellent!' : 'Not quite.'}</span>
            <span className="text-sm opacity-90">{prompt.explanation}</span>
          </div>
        </div>
      )}

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
