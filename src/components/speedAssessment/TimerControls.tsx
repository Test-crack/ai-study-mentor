import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Clock, Play, Pause, Square } from "lucide-react";

interface TimerControlsProps {
  isTimerRunning: boolean;
  readingStartTime: number | null;
  onStart: () => void;
  onPause: () => void;
  onResume: () => void;
  onStop: () => void;
}

export const TimerControls = ({
  isTimerRunning,
  readingStartTime,
  onStart,
  onPause,
  onResume,
  onStop
}: TimerControlsProps) => {
  return (
    <Card className="bg-gradient-to-r from-slate-50 to-gray-100 border-2 border-dashed border-gray-300">
      <CardContent className="p-6">
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center space-x-2">
            <Clock className="w-5 h-5 text-gray-600" />
            <span className="text-sm font-medium text-gray-600">Reading Timer Controls</span>
          </div>
          
          <div className="flex justify-center items-center space-x-4">
            {!isTimerRunning && readingStartTime === null && (
              <Button 
                onClick={onStart} 
                size="lg"
                className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 shadow-lg transform hover:scale-105 transition-all"
              >
                <Play className="w-5 h-5 mr-2" />
                Start Reading Timer
              </Button>
            )}
            
            {isTimerRunning && (
              <div className="flex items-center space-x-3">
                <Button 
                  onClick={onPause} 
                  size="lg"
                  className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 shadow-lg"
                >
                  <Pause className="w-5 h-5 mr-2" />
                  Pause
                </Button>
                <div className="flex items-center space-x-2 px-3 py-2 bg-green-100 rounded-lg">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-sm font-medium text-green-700">Timer Running</span>
                </div>
              </div>
            )}
            
            {!isTimerRunning && readingStartTime !== null && (
              <div className="flex items-center space-x-3">
                <Button 
                  onClick={onResume} 
                  size="lg"
                  className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 shadow-lg"
                >
                  <Play className="w-5 h-5 mr-2" />
                  Resume
                </Button>
                <div className="flex items-center space-x-2 px-3 py-2 bg-yellow-100 rounded-lg">
                  <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                  <span className="text-sm font-medium text-yellow-700">Timer Paused</span>
                </div>
              </div>
            )}
            
            {readingStartTime !== null && (
              <Button 
                onClick={onStop} 
                size="lg"
                className="bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 shadow-lg transform hover:scale-105 transition-all"
              >
                <Square className="w-5 h-5 mr-2" />
                Finish Reading
              </Button>
            )}
          </div>
          
          {readingStartTime === null && (
            <p className="text-sm text-gray-600 italic">
              💡 Click "Start Reading Timer" when you begin reading for accurate speed measurement
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
