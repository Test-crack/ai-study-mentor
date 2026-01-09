import { useState } from 'react';
import { Card, CardContent } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/shared/components/ui/radio-group';
import {
  CheckCircle,
  XCircle,
  HelpCircle,
  RotateCcw,
  Lightbulb,
} from 'lucide-react';
import { MCQContent as MCQContentType } from '../../types';
import { cn } from '@/shared/utils/utils';

interface MCQContentProps {
  mcq: MCQContentType;
  onComplete?: () => void;
  isAlreadyCompleted?: boolean;
}

export function MCQContent({ mcq, onComplete, isAlreadyCompleted = false }: MCQContentProps) {
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(isAlreadyCompleted);

  const isCorrect = isSubmitted && selectedAnswer === mcq.correct_answer;
  const isIncorrect = isSubmitted && selectedAnswer !== mcq.correct_answer;

  const handleSubmit = () => {
    if (!selectedAnswer) return;
    setIsSubmitted(true);
    if (onComplete) {
      onComplete();
    }
  };

  const handleReset = () => {
    setSelectedAnswer(null);
    setIsSubmitted(false);
  };

  const getOptionStyle = (optionId: string) => {
    if (!isSubmitted) {
      return selectedAnswer === optionId
        ? 'border-purple-400 bg-purple-50 shadow-sm'
        : 'border-gray-200 hover:border-purple-200 hover:bg-purple-50/50';
    }

    // After submission
    if (optionId === mcq.correct_answer) {
      return 'border-green-400 bg-green-50';
    }
    if (optionId === selectedAnswer && optionId !== mcq.correct_answer) {
      return 'border-red-400 bg-red-50';
    }
    return 'border-gray-200 bg-gray-50 opacity-60';
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
    <Card className="border-2 border-purple-100 bg-gradient-to-br from-white to-purple-50/30">
      <CardContent className="p-6 space-y-6">
        {/* Question */}
        <div className="space-y-3">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-purple-100 rounded-lg flex-shrink-0">
              <HelpCircle className="h-5 w-5 text-purple-600" />
            </div>
            <div className="flex-1">
              <p className="text-lg font-medium text-gray-900 leading-relaxed">
                {mcq.question}
              </p>
              {mcq.difficulty && (
                <span className="inline-block mt-2 text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded">
                  {mcq.difficulty} Level
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Options */}
        <RadioGroup
          value={selectedAnswer || ''}
          onValueChange={setSelectedAnswer}
          disabled={isSubmitted}
          className="space-y-3"
        >
          {mcq.options.map((option, index) => {
            const optionId = `option-${mcq.id}-${index}`;
            const optionLabel = String.fromCharCode(65 + index);
            const isThisCorrect = option.id === mcq.correct_answer;
            const isThisSelected = selectedAnswer === option.id;

            return (
              <label
                key={option.id}
                htmlFor={optionId}
                className={cn(
                  'flex items-center gap-4 p-4 rounded-xl border-2 transition-all',
                  isSubmitted ? 'cursor-default' : 'cursor-pointer',
                  getOptionStyle(option.id)
                )}
              >
                <div
                  className={cn(
                    'w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold flex-shrink-0 transition-all',
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
                <RadioGroupItem
                  value={option.id}
                  id={optionId}
                  className="sr-only"
                />
                <span
                  className={cn(
                    'flex-1 text-base',
                    isSubmitted && isThisCorrect
                      ? 'text-green-800 font-medium'
                      : isSubmitted && isThisSelected && !isThisCorrect
                      ? 'text-red-800'
                      : isThisSelected
                      ? 'text-purple-900 font-medium'
                      : 'text-gray-700'
                  )}
                >
                  {option.text}
                </span>
              </label>
            );
          })}
        </RadioGroup>

        {/* Result Feedback */}
        {isSubmitted && (
          <div
            className={cn(
              'p-4 rounded-xl border-2',
              isCorrect
                ? 'bg-green-50 border-green-200'
                : 'bg-red-50 border-red-200'
            )}
          >
            <div className="flex items-center gap-2 mb-2">
              {isCorrect ? (
                <>
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <span className="font-semibold text-green-800">
                    Correct! Well done!
                  </span>
                </>
              ) : (
                <>
                  <XCircle className="h-5 w-5 text-red-600" />
                  <span className="font-semibold text-red-800">
                    Incorrect. Keep learning!
                  </span>
                </>
              )}
            </div>

            {/* Explanation */}
            {mcq.explanation && (
              <div className="mt-3 pt-3 border-t border-gray-200">
                <div className="flex items-start gap-2">
                  <Lightbulb className="h-4 w-4 text-amber-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-1">
                      Explanation:
                    </p>
                    <p className="text-sm text-gray-600 leading-relaxed">
                      {mcq.explanation}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-between pt-4 border-t">
          {!isSubmitted ? (
            <>
              <p className="text-sm text-gray-500">
                Select an answer to continue
              </p>
              <Button
                onClick={handleSubmit}
                disabled={!selectedAnswer}
                className="bg-purple-600 hover:bg-purple-700 px-6"
              >
                Submit Answer
              </Button>
            </>
          ) : (
            <>
              <div
                className={cn(
                  'flex items-center gap-2',
                  isCorrect ? 'text-green-600' : 'text-red-600'
                )}
              >
                {isCorrect ? (
                  <CheckCircle className="h-5 w-5" />
                ) : (
                  <XCircle className="h-5 w-5" />
                )}
                <span className="font-medium">
                  {isCorrect ? 'Answer correct!' : 'Answer incorrect'}
                </span>
              </div>
              <Button variant="outline" onClick={handleReset} className="gap-2">
                <RotateCcw className="h-4 w-4" />
                Try Again
              </Button>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
