import { Card } from "@/shared/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/shared/components/ui/radio-group";
import { Label } from "@/shared/components/ui/label";
import { Question } from "@/features/reading-assessment/services/reading-api";

interface QuestionCardProps {
  question: Question;
  index: number;
  selectedAnswer: string | undefined;
  onAnswerChange: (questionId: string, selectedOption: string) => void;
}

export const QuestionCard = ({
  question,
  index,
  selectedAnswer,
  onAnswerChange
}: QuestionCardProps) => {
  return (
    <Card className="p-6 bg-gradient-to-br from-white to-gray-50 border-l-4 border-l-blue-500 shadow-md hover:shadow-lg transition-shadow">
      <div className="space-y-4">
        <div className="flex items-start space-x-3">
          <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
            <span className="text-white font-bold text-sm">{index + 1}</span>
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-800 leading-6">
              {question.stem}
            </h3>
          </div>
        </div>
        
        <div className="ml-11">
          <RadioGroup
            value={selectedAnswer || ''}
            onValueChange={(value) => onAnswerChange(question.id, value)}
            className="space-y-3"
          >
            {question.options.map((option, optionIndex) => {
              const optionLabel = String.fromCharCode(65 + optionIndex);
              const isSelected = selectedAnswer === option;
              return (
                <div key={optionIndex} className={`flex items-start space-x-3 p-3 rounded-lg border-2 transition-all hover:bg-blue-50 hover:border-blue-200 ${
                  isSelected ? 'bg-blue-50 border-blue-400 shadow-sm' : 'border-gray-200'
                }`}>
                  <RadioGroupItem value={option} id={`q${question.id}-${optionIndex}`} className="mt-0.5" />
                  <div className="flex items-start space-x-3 flex-1">
                    <span className={`flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center text-xs font-bold ${
                      isSelected ? 'bg-blue-500 text-white border-blue-500' : 'border-gray-300 text-gray-500'
                    }`}>
                      {optionLabel}
                    </span>
                    <Label 
                      htmlFor={`q${question.id}-${optionIndex}`} 
                      className={`cursor-pointer text-base leading-6 flex-1 ${
                        isSelected ? 'text-gray-800 font-medium' : 'text-gray-700'
                      }`}
                    >
                      {option}
                    </Label>
                  </div>
                </div>
              );
            })}
          </RadioGroup>
        </div>
      </div>
    </Card>
  );
};
