import { useState, useEffect } from "react";
import { format } from "date-fns";
import { Card, CardContent } from "@/shared/components/ui/card";
import { Button } from "@/shared/components/ui/button";
import { Badge } from "@/shared/components/ui/badge";
import { ScrollArea } from "@/shared/components/ui/scroll-area";
import { Loader2, Clock, CheckCircle2, Zap, Calendar } from "lucide-react";
import { getAssessmentHistory, type AssessmentHistoryItem } from "@/features/reading-assessment/services/reading-api";

export function AssessmentHistoryWidget() {
  const [history, setHistory] = useState<AssessmentHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      const data = await getAssessmentHistory(5); // Fetch last 5
      setHistory(data.history || []);
    } catch (err) {
      console.error("Failed to load history", err);
      setError("Failed to load history");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card className="border-none shadow-sm bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
        <CardContent className="p-6 flex justify-center items-center min-h-[200px]">
          <Loader2 className="h-6 w-6 animate-spin text-brand-teal-600" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="border-none shadow-sm bg-white dark:bg-slate-900">
        <CardContent className="p-6 text-center text-red-500">
          {error}
          <Button variant="link" onClick={fetchHistory} className="ml-2">Retry</Button>
        </CardContent>
      </Card>
    );
  }

  if (history.length === 0) {
    return (
      <Card className="border-none shadow-sm bg-white dark:bg-slate-900">
        <CardContent className="p-0">
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            <div className="p-8 text-center text-slate-500 dark:text-slate-400">
              <p className="mb-2">No assessments completed yet.</p>
              <p className="text-sm">Take your first assessment to track your progress!</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-none shadow-sm bg-white dark:bg-slate-900 overflow-hidden">
      <CardContent className="p-0">
        <ScrollArea className="h-[400px]">
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {history.map((assessment) => (
                <div key={assessment.id} className="p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors flex items-center justify-between group">
                    <div className="space-y-1">
                        <div className="flex items-center gap-2">
                            <h4 className="font-semibold text-slate-900 dark:text-white">
                                {assessment.passageTitle || "Reading Assessment"}
                            </h4>
                            <Badge variant="outline" className="text-xs capitalize bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700">
                                {assessment.difficulty}
                            </Badge>
                        </div>
                        <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400">
                            <span className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {assessment.createdAt ? format(new Date(assessment.createdAt), "MMM d, yyyy") : "Unknown Date"}
                            </span>
                            <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {Math.floor(assessment.readingTimeSeconds / 60)}:{(assessment.readingTimeSeconds % 60).toString().padStart(2, '0')}
                            </span>
                        </div>
                    </div>

                    <div className="flex items-center gap-6">
                        <div className="text-center">
                            <div className="text-lg font-bold text-brand-teal-600 dark:text-brand-teal-400 flex items-center justify-center gap-1">
                                <Zap className="h-4 w-4" />
                                {Math.round(assessment.weightedWPM)}
                            </div>
                            <div className="text-[10px] uppercase tracking-wider text-slate-400 font-medium">WPM</div>
                        </div>
                        <div className="text-center">
                            <div className="text-lg font-bold text-emerald-600 dark:text-emerald-400 flex items-center justify-center gap-1">
                                <CheckCircle2 className="h-4 w-4" />
                                {Math.round(assessment.accuracy)}%
                            </div>
                            <div className="text-[10px] uppercase tracking-wider text-slate-400 font-medium">Acc.</div>
                        </div>
                    </div>
                </div>
            ))}
            </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
