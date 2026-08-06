import { Button } from "@/shared/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Progress } from "@/shared/components/ui/progress";
import { Badge } from "@/shared/components/ui/badge";
import { Award, Eye } from "lucide-react";
import { PassageData, ReadingModule } from "@/features/reading-assessment/services/reading-api";
import { QuestionCard } from "./QuestionCard";

interface QuestionsViewProps {
  moduleData: ReadingModule | undefined;
  currentPassage: PassageData;
  answers: { [key: string]: string };
  totalReadingTime: number;
  focusData: {
    focusRatio: number;
    tabSwitches: number;
  };
  formatTime: (seconds: number) => string;
  onAnswerChange: (questionId: string, selectedOption: string) => void;
  onCalculateResults: () => void;
  loading?: boolean; // Add loading prop
}

export const QuestionsView = ({
  moduleData,
  currentPassage,
  answers,
  totalReadingTime,
  focusData,
  formatTime,
  onAnswerChange,
  onCalculateResults,
  loading = false // Add loading with default
}: QuestionsViewProps) => {
  return (
    <Card className="max-w-4xl mx-auto">
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>Comprehension Questions - {moduleData?.name}</CardTitle>
            <CardDescription>Answer the following questions based on what you just read</CardDescription>
          </div>
          <div className="text-right">
            <p className="text-sm font-medium">Reading Time: {formatTime(totalReadingTime)}</p>
            <p className="text-xs text-muted-foreground">
              {currentPassage.wordCount} words
            </p>
            <div className="flex items-center justify-end space-x-2 mt-1">
              <div className={`flex items-center space-x-1 text-xs ${
                focusData.focusRatio > 0.8 ? 'text-green-600' : 
                focusData.focusRatio > 0.6 ? 'text-yellow-600' : 'text-red-600'
              }`}>
                <Eye className="h-3 w-3" />
                <span>Focus: {Math.round(focusData.focusRatio * 100)}%</span>
              </div>
              {focusData.tabSwitches > 0 && (
                <Badge variant="outline" className="text-xs">
                  {focusData.tabSwitches} switch{focusData.tabSwitches > 1 ? 'es' : ''}
                </Badge>
              )}
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-6">
          {currentPassage.questions.map((question, index) => (
            <QuestionCard
              key={question.id}
              question={question}
              index={index}
              selectedAnswer={answers[question.id]}
              onAnswerChange={onAnswerChange}
            />
          ))}
        </div>
        
        <div className="bg-gradient-to-r from-blue-50 to-brand-blue-50 p-4 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">Progress</span>
            <span className="text-sm font-medium text-gray-700">
              {Object.keys(answers).length} / {currentPassage.questions.length} answered
            </span>
          </div>
          <Progress 
            value={((Object.keys(answers).length) / (currentPassage.questions.length || 1)) * 100} 
            className="h-2"
          />
        </div>
        
        <div className="flex flex-col items-center space-y-4">
          <Button 
            onClick={onCalculateResults}
            disabled={Object.keys(answers).length !== currentPassage.questions.length || totalReadingTime === 0 || loading}
            size="lg"
            className="w-full max-w-md bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 shadow-lg transform hover:scale-105 transition-all disabled:transform-none disabled:opacity-50"
          >
            <Award className="w-5 h-5 mr-2" />
            {loading ? "Submitting..." : "Complete Assessment & Get Results"}
          </Button>
          
          {totalReadingTime === 0 && (
            <div className="text-center p-4 bg-red-50 rounded-lg border border-red-200">
              <p className="text-sm text-red-700 font-medium">
                ⚠️ Please go back and complete the reading with timer tracking to get accurate results.
              </p>
            </div>
          )}
          
          {Object.keys(answers).length < currentPassage.questions.length && (
            <p className="text-sm text-amber-600 text-center">
              📝 Please answer all questions to continue
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
