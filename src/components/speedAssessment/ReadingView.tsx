import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock } from "lucide-react";
import { PassageData, ReadingModule } from "@/lib/reading-api";
import { TimerControls } from "./TimerControls";
import { ReadingPassage } from "./ReadingPassage";
import { FocusIndicator } from "./FocusIndicator";

interface ReadingViewProps {
  moduleData: ReadingModule | undefined;
  currentPassage: PassageData;
  currentTime: number;
  isTimerRunning: boolean;
  readingStartTime: number | null;
  focusData: {
    isCurrentlyFocused: boolean;
    tabSwitches: number;
  };
  formatTime: (seconds: number) => string;
  onStartTimer: () => void;
  onPauseTimer: () => void;
  onResumeTimer: () => void;
  onStopTimer: () => void;
}

export const ReadingView = ({
  moduleData,
  currentPassage,
  currentTime,
  isTimerRunning,
  readingStartTime,
  focusData,
  formatTime,
  onStartTimer,
  onPauseTimer,
  onResumeTimer,
  onStopTimer
}: ReadingViewProps) => {
  return (
    <Card className="max-w-4xl mx-auto">
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>Reading Assessment - {moduleData?.name}</CardTitle>
            <CardDescription>{currentPassage.title}</CardDescription>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2 text-lg font-bold">
              <Clock className="h-5 w-5" />
              <span className="text-blue-600">
                {formatTime(currentTime)}
              </span>
            </div>
            {isTimerRunning && (
              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
            )}
            <FocusIndicator 
              isCurrentlyFocused={focusData.isCurrentlyFocused}
              tabSwitches={focusData.tabSwitches}
            />
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <TimerControls
          isTimerRunning={isTimerRunning}
          readingStartTime={readingStartTime}
          onStart={onStartTimer}
          onPause={onPauseTimer}
          onResume={onResumeTimer}
          onStop={onStopTimer}
        />
        
        <ReadingPassage passage={currentPassage} />
      </CardContent>
    </Card>
  );
};
