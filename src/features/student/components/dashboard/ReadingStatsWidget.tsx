import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Zap, Target, TrendingUp, Award, Activity } from "lucide-react";
import { Progress } from "@/shared/components/ui/progress";

interface ReadingStatsProps {
  wpm: number;
  accuracy: number;
  assessmentsCompleted: number;
  bestWpm: number;
}

export function ReadingStatsWidget({ wpm, accuracy, assessmentsCompleted, bestWpm }: ReadingStatsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      {/* Current Speed */}
      <Card className="bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 shadow-sm relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
            <Zap className="h-12 w-12 text-brand-teal-600" />
        </div>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-slate-500 dark:text-slate-400">
            Avg. Speed
          </CardTitle>
          <Zap className="h-4 w-4 text-brand-teal-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-slate-900 dark:text-white">{wpm} <span className="text-xs font-normal text-slate-500">WPM</span></div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Best: <span className="text-brand-teal-600 dark:text-brand-teal-400 font-medium">{bestWpm} WPM</span>
          </p>
        </CardContent>
      </Card>

      {/* Accuracy/Comprehension */}
      <Card className="bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 shadow-sm relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
            <Target className="h-12 w-12 text-emerald-600" />
        </div>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-slate-500 dark:text-slate-400">
            Comprehension
          </CardTitle>
          <Target className="h-4 w-4 text-emerald-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-slate-900 dark:text-white">{accuracy}%</div>
          <Progress value={accuracy} className="h-1.5 mt-2 bg-slate-100 dark:bg-slate-800" indicatorClassName="bg-emerald-600" />
        </CardContent>
      </Card>

      {/* Assessments Completed */}
      <Card className="bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 shadow-sm relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
            <Activity className="h-12 w-12 text-blue-600" />
        </div>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-slate-500 dark:text-slate-400">
            Assessments
          </CardTitle>
          <Activity className="h-4 w-4 text-blue-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-slate-900 dark:text-white">{assessmentsCompleted}</div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Lifetime total
          </p>
        </CardContent>
      </Card>

      {/* Rank/Level */}
      <Card className="bg-gradient-to-br from-brand-teal-600 to-brand-blue-700 text-white border-none shadow-md relative overflow-hidden">
        <div className="absolute top-0 right-0 p-3 opacity-20">
            <Award className="h-12 w-12 text-white" />
        </div>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-brand-teal-100">
            Reading Level
          </CardTitle>
          <Award className="h-4 w-4 text-white" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-white">
            {wpm > 300 ? "Expert" : wpm > 200 ? "Advanced" : wpm > 100 ? "Intermediate" : "Beginner"}
          </div>
          <p className="text-xs text-brand-teal-200 mt-1">
            Top {wpm > 300 ? "5%" : wpm > 200 ? "15%" : "50%"} of students
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
