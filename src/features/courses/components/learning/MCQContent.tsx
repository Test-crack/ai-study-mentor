import { useState, useEffect, useRef } from 'react';
import { Card, CardContent } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import {
  CheckCircle,
  XCircle,
  HelpCircle,
  Lightbulb,
  Target,
  Zap
} from 'lucide-react';
import { MCQContent as MCQContentType } from '../../types';
import { cn } from '@/shared/utils/utils';

interface MCQContentProps {
  mcq: MCQContentType;
  onComplete?: () => void;
  isAlreadyCompleted?: boolean;
  onContinue?: () => void;
  isFocusMode?: boolean;
  onToggleFocus?: () => void;
}

export function MCQContent({ 
  mcq, 
  onComplete, 
  isAlreadyCompleted = false, 
  onContinue,
  isFocusMode = false,
  onToggleFocus 
}: MCQContentProps) {
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [hasCalledComplete, setHasCalledComplete] = useState(false);
  
  // Ref to track the current MCQ ID to detect real navigation vs. state updates
  const lastIdRef = useRef<string>(mcq.id);

  // Optimized Effect to prevent flickering
  useEffect(() => {
    const isNewQuestion = mcq.id !== lastIdRef.current;

    if (isNewQuestion) {
      // If the ID changed, reset everything for the new question
      // Check for saved answer in localStorage
      const savedAnswer = localStorage.getItem(`mcq_state_${mcq.id}`);
      setSelectedAnswer(savedAnswer);
      
      // If we have a saved answer, we should treat it as submitted so the user sees their result immediately
      // This handles the "come back" scenario
      const shouldBeSubmitted = isAlreadyCompleted || !!savedAnswer;
      setIsSubmitted(shouldBeSubmitted);
      setHasCalledComplete(isAlreadyCompleted); // Only mark as completed if server says so (or we could infer it, but let's stick to server for progress tracking)
      
      lastIdRef.current = mcq.id;
    } else {
      // If it's the same question but the parent prop updated (progress saved)
      // Sync the submission status but DO NOT reset selectedAnswer
      if (isAlreadyCompleted) {
        setIsSubmitted(true);
        setHasCalledComplete(true);
      }
    }
  }, [mcq.id, isAlreadyCompleted]);

  // isCorrect calculation depends on local state being stable
  const isCorrect = isSubmitted && selectedAnswer === mcq.correct_answer;

  const handleOptionSelect = (optionId: string) => {
    if (isSubmitted) return;
    setSelectedAnswer(optionId);
  };

  const handleSubmit = () => {
    if (!selectedAnswer) return;
    
    // Save to localStorage
    localStorage.setItem(`mcq_state_${mcq.id}`, selectedAnswer);
    
    setIsSubmitted(true);
    
    if (!hasCalledComplete && onComplete) {
      setHasCalledComplete(true);
      onComplete();
    }
  };

  const getOptionStyle = (optionId: string) => {
    if (!isSubmitted) {
      return selectedAnswer === optionId
        ? 'border-purple-500 bg-purple-50'
        : 'border-gray-200 hover:border-purple-300 hover:bg-purple-50/50';
    }

    if (optionId === mcq.correct_answer) {
      return 'border-green-500 bg-green-50';
    }
    if (optionId === selectedAnswer && optionId !== mcq.correct_answer) {
      return 'border-red-500 bg-red-50';
    }
    return 'border-gray-200 bg-gray-50 opacity-50';
  };

  const getOptionLabelStyle = (optionId: string) => {
    if (!isSubmitted) {
      return selectedAnswer === optionId
        ? 'bg-purple-600 text-white'
        : 'bg-gray-100 text-gray-600';
    }

    if (optionId === mcq.correct_answer) {
      return 'bg-green-600 text-white';
    }
    if (optionId === selectedAnswer && optionId !== mcq.correct_answer) {
      return 'bg-red-600 text-white';
    }
    return 'bg-gray-100 text-gray-400';
  };

  return (
    <div className={cn(
      "transition-all duration-700 ease-in-out",
      isFocusMode ? "max-w-3xl mx-auto py-12" : "w-full"
    )}>
      <Card className={cn(
        "border-2 transition-all duration-500 overflow-hidden relative z-20",
        isFocusMode 
          ? "border-purple-500 shadow-[0_0_50px_-12px_rgba(147,51,234,0.4)] scale-[1.02] bg-white" 
          : "border-purple-100 bg-gradient-to-br from-white to-purple-50/30"
      )}>
        <CardContent className="p-0">
          <div className={cn(
            "p-6 text-white transition-all duration-500",
            isFocusMode ? "bg-slate-900" : "bg-gradient-to-r from-purple-600 to-indigo-600"
          )}>
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-white/20 rounded-lg flex-shrink-0">
                  <HelpCircle className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-lg font-medium leading-relaxed">
                    {mcq.question}
                  </p>
                  {mcq.difficulty && (
                    <span className="inline-block mt-3 text-xs px-2 py-1 bg-white/20 rounded">
                      {mcq.difficulty} Level
                    </span>
                  )}
                </div>
              </div>

              <Button
                variant="ghost"
                size="sm"
                onClick={onToggleFocus}
                className={cn(
                  "gap-2 border-white/20 border hover:bg-white/20 text-white transition-all",
                  isFocusMode && "bg-purple-600 border-purple-400 hover:bg-purple-500"
                )}
              >
                {isFocusMode ? <Zap className="h-4 w-4 fill-current text-amber-300" /> : <Target className="h-4 w-4" />}
                <span className="text-[10px] font-black uppercase tracking-widest">
                  {isFocusMode ? 'Focus On' : 'Focus Mode'}
                </span>
              </Button>
            </div>
          </div>

          <div className="p-6">
            <div className="space-y-3" role="radiogroup" aria-label="Answer options">
              {mcq.options.map((option, index) => {
                const optionLabel = String.fromCharCode(65 + index);
                const isThisCorrect = option.id === mcq.correct_answer;
                const isThisSelected = selectedAnswer === option.id;

                return (
                  <div
                    key={option.id}
                    role="radio"
                    aria-checked={isThisSelected}
                    tabIndex={isSubmitted ? -1 : 0}
                    onClick={() => handleOptionSelect(option.id)}
                    className={cn(
                      'flex items-center gap-4 p-4 rounded-xl border-2 transition-all',
                      isSubmitted ? 'cursor-default' : 'cursor-pointer',
                      getOptionStyle(option.id)
                    )}
                  >
                    <div
                      className={cn(
                        'w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 transition-colors',
                        getOptionLabelStyle(option.id)
                      )}
                    >
                      {isSubmitted && isThisCorrect ? (
                        <CheckCircle className="h-5 w-5" />
                      ) : isSubmitted && isThisSelected && !isThisCorrect ? (
                        <XCircle className="h-5 w-5" />
                      ) : (
                        optionLabel
                      )}
                    </div>
                    <span className={cn(
                      'flex-1 text-base',
                      isSubmitted && isThisCorrect ? 'text-green-800 font-semibold' : 
                      isSubmitted && isThisSelected && !isThisCorrect ? 'text-red-800 font-medium' :
                      isThisSelected ? 'text-purple-900 font-medium' : 'text-gray-700'
                    )}>
                      {option.text}
                    </span>
                  </div>
                );
              })}
            </div>

            {isSubmitted && (
              <div className={cn(
                'mt-6 p-5 rounded-xl border-2 animate-in fade-in slide-in-from-top-2 duration-500',
                isCorrect 
                  ? 'bg-green-50 border-green-200' 
                  : !selectedAnswer 
                    ? 'bg-blue-50 border-blue-200' 
                    : 'bg-amber-50 border-amber-200'
              )}>
                <div className="flex items-center gap-3 mb-3">
                  {isCorrect ? (
                    <>
                      <div className="p-2 bg-green-100 rounded-full flex-shrink-0">
                        <CheckCircle className="h-6 w-6 text-green-600" />
                      </div>
                      <div>
                        <span className="font-bold text-green-800 text-lg">Correct! 🎉</span>
                        <p className="text-green-600 text-sm">Great job!</p>
                      </div>
                    </>
                  ) : !selectedAnswer ? (
                     <>
                      <div className="p-2 bg-blue-100 rounded-full flex-shrink-0">
                        <Lightbulb className="h-6 w-6 text-blue-600" />
                      </div>
                      <div>
                        <span className="font-bold text-blue-800 text-lg">Review Mode</span>
                        <p className="text-blue-600 text-sm">Review the explanation below</p>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="p-2 bg-amber-100 rounded-full flex-shrink-0">
                        <XCircle className="h-6 w-6 text-amber-600" />
                      </div>
                      <div>
                        <span className="font-bold text-amber-800 text-lg">Not quite right</span>
                        <p className="text-amber-600 text-sm">Review the explanation below</p>
                      </div>
                    </>
                  )}
                </div>

                {mcq.explanation && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <div className="flex items-start gap-3">
                      <div className="p-1.5 bg-amber-100 rounded-lg flex-shrink-0">
                        <Lightbulb className="h-4 w-4 text-amber-600" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-gray-700 mb-1">Explanation</p>
                        <p className="text-sm text-gray-600 leading-relaxed">{mcq.explanation}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="flex items-center justify-between mt-6 pt-4 border-t">
              {!isSubmitted ? (
                <>
                  <p className="text-sm text-gray-500">
                    {selectedAnswer ? 'Ready to submit' : 'Select an answer to continue'}
                  </p>
                  <Button
                    onClick={handleSubmit}
                    disabled={!selectedAnswer}
                    size="lg"
                    className={cn(
                      'px-8 font-bold transition-all',
                      selectedAnswer ? 'bg-purple-600 hover:bg-purple-700 shadow-lg' : 'bg-gray-300'
                    )}
                  >
                    Submit Answer
                  </Button>
                </>
              ) : (
                <span className={cn(
                  'flex items-center gap-2 text-sm font-medium px-4 py-2 rounded-full border transition-all',
                  isCorrect ? 'text-green-700 bg-green-50 border-green-100' : 'text-amber-700 bg-amber-50 border-amber-100'
                )}>
                  <CheckCircle className="h-4 w-4" />
                  Completed
                </span>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}