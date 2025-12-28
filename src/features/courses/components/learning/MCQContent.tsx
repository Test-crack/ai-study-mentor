import { useState } from 'react';
import { Card, CardContent } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/shared/components/ui/radio-group';
import { Label } from '@/shared/components/ui/label';
import { CheckCircle, HelpCircle, RotateCcw } from 'lucide-react';
import { MCQContent as MCQContentType } from '../../types';
import { cn } from '@/shared/utils/utils';

interface MCQContentProps {
  mcq: MCQContentType;
  onComplete?: () => void;
}

export function MCQContent({ mcq, onComplete }: MCQContentProps) {
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = () => {
    if (!selectedAnswer) return;
    setIsSubmitted(true);
    // Mark as complete when submitted
    if (onComplete) {
      onComplete();
    }
  };

  const handleReset = () => {
    setSelectedAnswer(null);
    setIsSubmitted(false);
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
            const isSelected = selectedAnswer === option.id;
            const optionLabel = String.fromCharCode(65 + index); // A, B, C, D...

            return (
              <label
                key={option.id}
                htmlFor={optionId}
                className={cn(
                  'flex items-center gap-4 p-4 rounded-xl border-2 transition-all cursor-pointer',
                  isSubmitted
                    ? 'cursor-not-allowed'
                    : isSelected
                    ? 'border-purple-400 bg-purple-50 shadow-sm'
                    : 'border-gray-200 hover:border-purple-200 hover:bg-purple-50/50'
                )}
              >
                <div
                  className={cn(
                    'w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold flex-shrink-0',
                    isSelected
                      ? 'bg-purple-600 text-white'
                      : 'bg-gray-100 text-gray-600'
                  )}
                >
                  {optionLabel}
                </div>
                <RadioGroupItem
                  value={option.id}
                  id={optionId}
                  className="sr-only"
                />
                <span
                  className={cn(
                    'flex-1 text-base',
                    isSelected ? 'text-purple-900 font-medium' : 'text-gray-700'
                  )}
                >
                  {option.text}
                </span>
              </label>
            );
          })}
        </RadioGroup>

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
              <div className="flex items-center gap-2 text-green-600">
                <CheckCircle className="h-5 w-5" />
                <span className="font-medium">Answer submitted</span>
              </div>
              <Button
                variant="outline"
                onClick={handleReset}
                className="gap-2"
              >
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
