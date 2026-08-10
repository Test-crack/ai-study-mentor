import { Button } from "@/shared/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { PassageData, ReadingModule } from "@/features/reading-assessment/services/reading-api";

interface InstructionsProps {
  moduleData: ReadingModule | undefined;
  selectedDifficulty: string;
  currentPassage: PassageData | null;
  onBeginReading: () => void;
}

export const Instructions = ({
  moduleData,
  selectedDifficulty,
  currentPassage,
  onBeginReading
}: InstructionsProps) => {
  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">Assessment Instructions</CardTitle>
        <CardDescription>
          {moduleData?.name} - {selectedDifficulty && selectedDifficulty.charAt(0).toUpperCase() + selectedDifficulty.slice(1)} Level
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div className="flex items-start space-x-3">
            <div className="bg-brand-blue-100 text-brand-blue-600 rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">1</div>
            <p>Read the passage about <strong>{moduleData?.name}</strong> at your natural pace</p>
          </div>
          <div className="flex items-start space-x-3">
            <div className="bg-brand-blue-100 text-brand-blue-600 rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">2</div>
            <p>Use the timer controls to track your reading time accurately</p>
          </div>
          <div className="flex items-start space-x-3">
            <div className="bg-brand-blue-100 text-brand-blue-600 rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">3</div>
            <p>Answer comprehension questions based on what you read</p>
          </div>
          <div className="flex items-start space-x-3">
            <div className="bg-brand-blue-100 text-brand-blue-600 rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">4</div>
            <p>Get your personalized reading speed and comprehension score</p>
          </div>
        </div>
        
        {currentPassage && (
          <div className="bg-blue-50 p-4 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>Passage Info:</strong> {currentPassage.wordCount} words | {currentPassage.difficulty} difficulty
            </p>
            <p className="text-sm text-blue-800 mt-2">
              <strong>Estimated Reading Time:</strong> {currentPassage.estimatedReadingTime} seconds | 
              <strong>Target Speed:</strong> {currentPassage.idealWPM} WPM
            </p>
          </div>
        )}
        
        <div className="bg-green-50 p-4 rounded-lg">
          <p className="text-sm text-green-800">
            <strong>Tip:</strong> Read at your normal pace and try to understand the content. 
            You can pause and resume the timer as needed.
          </p>
        </div>
        
        <Button onClick={onBeginReading} className="w-full">
          Begin Reading
        </Button>
      </CardContent>
    </Card>
  );
};
