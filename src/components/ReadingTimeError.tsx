import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Clock, AlertTriangle, RotateCcw, BookOpen, Target } from "lucide-react";
import { ReadingTimeError as ReadingTimeErrorType } from "@/lib/reading-api";

interface ReadingTimeErrorProps {
  error: ReadingTimeErrorType;
  onRetry: () => void;
  onStartOver: () => void;
  currentPassageTitle?: string;
}

export const ReadingTimeError = ({ 
  error, 
  onRetry, 
  onStartOver, 
  currentPassageTitle 
}: ReadingTimeErrorProps) => {
  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const suggestedMinutes = Math.ceil(error.suggestedMinTime / 60);
  const actualMinutes = Math.ceil(error.actualTime / 60);
  const timeDifference = error.suggestedMinTime - error.actualTime;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Error Header */}
      <Card className="bg-gradient-to-r from-red-500 via-orange-500 to-yellow-500 text-white overflow-hidden relative">
        <div className="absolute inset-0 bg-gradient-to-r from-red-500/90 via-orange-500/90 to-yellow-500/90"></div>
        <CardContent className="relative z-10 p-8 text-center">
          <div className="space-y-4">
            <div className="text-6xl animate-bounce">⚠️</div>
            <CardTitle className="text-4xl font-bold">
              Reading Too Fast!
            </CardTitle>
            <div className="text-lg opacity-90">
              {currentPassageTitle && `${currentPassageTitle} • `}Speed Reading Assessment
            </div>
            <div className="inline-flex items-center px-6 py-2 rounded-full text-lg font-semibold bg-white/20 backdrop-blur-sm">
              <AlertTriangle className="w-5 h-5 mr-2" />
              Reading Time Issue Detected
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Error Details */}
      <Card className="bg-gradient-to-br from-red-50 to-orange-50 border-2 border-red-200">
        <CardHeader>
          <CardTitle className="flex items-center text-red-800">
            <div className="p-2 bg-red-500 rounded-lg mr-3">
              <Clock className="w-5 h-5 text-white" />
            </div>
            Reading Time Analysis
          </CardTitle>
          <CardDescription className="text-red-700">
            Your reading speed was too fast to ensure proper comprehension
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-lg border-2 border-red-200">
              <div className="text-center space-y-3">
                <div className="text-3xl font-bold text-red-600">{formatTime(error.actualTime)}</div>
                <div className="text-sm font-medium text-red-700">Your Reading Time</div>
                <div className="text-xs text-red-600">Too fast for proper comprehension</div>
              </div>
            </div>
            
            <div className="bg-white p-6 rounded-lg border-2 border-green-200">
              <div className="text-center space-y-3">
                <div className="text-3xl font-bold text-green-600">{formatTime(error.suggestedMinTime)}</div>
                <div className="text-sm font-medium text-green-700">Minimum Required Time</div>
                <div className="text-xs text-green-600">For accurate assessment</div>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg border border-orange-200">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-orange-800">Time Difference</span>
                <span className="text-lg font-bold text-orange-600">
                  {formatTime(timeDifference)} more needed
                </span>
              </div>
              <Progress 
                value={(error.actualTime / error.suggestedMinTime) * 100} 
                className="h-3"
              />
              <div className="text-center text-sm text-orange-700">
                You need to read for at least {suggestedMinutes} minute{suggestedMinutes > 1 ? 's' : ''} 
                to ensure proper comprehension
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Why This Matters */}
      <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200">
        <CardHeader>
          <CardTitle className="flex items-center text-blue-800">
            <div className="p-2 bg-blue-500 rounded-lg mr-3">
              <Target className="w-5 h-5 text-white" />
            </div>
            Why Reading Time Matters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-start space-x-3">
                <div className="bg-blue-100 text-blue-600 rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">1</div>
                <p className="text-blue-800">
                  <strong>Comprehension:</strong> Reading too fast can reduce your understanding of the material
                </p>
              </div>
              <div className="flex items-start space-x-3">
                <div className="bg-blue-100 text-blue-600 rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">2</div>
                <p className="text-blue-800">
                  <strong>Accuracy:</strong> Proper timing ensures more accurate speed measurements
                </p>
              </div>
              <div className="flex items-start space-x-3">
                <div className="bg-blue-100 text-blue-600 rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">3</div>
                <p className="text-blue-800">
                  <strong>Learning:</strong> Taking time to read helps you retain information better
                </p>
              </div>
              <div className="flex items-start space-x-3">
                <div className="bg-blue-100 text-blue-600 rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">4</div>
                <p className="text-blue-800">
                  <strong>Assessment:</strong> Proper timing gives you meaningful results
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tips for Better Reading */}
      <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200">
        <CardHeader>
          <CardTitle className="flex items-center text-green-800">
            <div className="p-2 bg-green-500 rounded-lg mr-3">
              <BookOpen className="w-5 h-5 text-white" />
            </div>
            Tips for Better Reading
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="bg-white p-4 rounded-lg border border-green-200">
              <p className="text-green-800 font-medium mb-2">💡 Read at a comfortable pace</p>
              <p className="text-sm text-green-700">Don't rush - focus on understanding the content</p>
            </div>
            <div className="bg-white p-4 rounded-lg border border-green-200">
              <p className="text-green-800 font-medium mb-2">📖 Take your time with complex sentences</p>
              <p className="text-sm text-green-700">Pause to process information and make connections</p>
            </div>
            <div className="bg-white p-4 rounded-lg border border-green-200">
              <p className="text-green-800 font-medium mb-2">🎯 Focus on comprehension over speed</p>
              <p className="text-sm text-green-700">Understanding is more important than finishing quickly</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <Card className="bg-gradient-to-r from-blue-500 to-purple-600 text-white">
        <CardContent className="p-8 text-center">
          <h3 className="text-xl font-semibold mb-4">Ready to try again?</h3>
          <div className="flex flex-col sm:flex-row justify-center items-center space-y-3 sm:space-y-0 sm:space-x-4">
            <Button 
              onClick={onRetry}
              size="lg"
              className="bg-white text-blue-600 hover:bg-blue-50 shadow-lg transform hover:scale-105 transition-all"
            >
              <RotateCcw className="w-5 h-5 mr-2" />
              Re-read This Passage
            </Button>
            
            <Button 
              onClick={onStartOver}
              size="lg"
              variant="outline"
              className="border-2 border-white text-white hover:bg-white hover:text-blue-600 shadow-lg transform hover:scale-105 transition-all"
            >
              <BookOpen className="w-5 h-5 mr-2" />
              Choose Different Passage
            </Button>
          </div>
          <p className="text-sm opacity-90 mt-4">
            Take your time to read carefully and understand the content
          </p>
        </CardContent>
      </Card>
    </div>
  );
};
