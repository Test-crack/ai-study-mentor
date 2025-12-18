import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  History, 
  TrendingUp, 
  Calendar,
  Filter,
  BarChart3,
  LineChart as LineChartIcon,
  Clock,
  Target,
  Zap,
  Award
} from "lucide-react";
import { getAssessmentHistory, type AssessmentHistoryItem } from "@/lib/reading-api";
import { useToast } from "@/hooks/use-toast";
import { HistoryChart } from "./HistoryChart";
import { HistoryTable } from "./HistoryTable";

export const AssessmentHistory = () => {
  const [history, setHistory] = useState<AssessmentHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [difficulty, setDifficulty] = useState<string>("all");
  const [days, setDays] = useState<number>(30);
  const [viewMode, setViewMode] = useState<"chart" | "table">("chart");
  const { toast } = useToast();

  useEffect(() => {
    loadHistory();
  }, [difficulty, days]);

  const loadHistory = async () => {
    try {
      setLoading(true);
      const data = await getAssessmentHistory(
        50,
        difficulty === "all" ? undefined : difficulty,
        days
      );
      setHistory(data.history);
    } catch (error: any) {
      console.error('Error loading history:', error);
      toast({
        title: "Failed to load history",
        description: error.message || "Please try again later",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = () => {
    if (history.length === 0) return null;

    // Helper to normalize scores (handle both decimal 0-1 and percentage 0-100)
    const normalizeScore = (score: number) => score <= 1 ? score * 100 : score;

    const avgWPM = history.reduce((sum, item) => sum + item.weightedWPM, 0) / history.length;
    const avgAccuracy = history.reduce((sum, item) => sum + normalizeScore(item.accuracy), 0) / history.length;
    const avgRetention = history.reduce((sum, item) => sum + normalizeScore(item.retention), 0) / history.length;
    const avgSpeedLearning = history.reduce((sum, item) => sum + normalizeScore(item.speedLearningScore), 0) / history.length;

    const maxWPM = Math.max(...history.map(item => item.weightedWPM));
    const maxAccuracy = Math.max(...history.map(item => normalizeScore(item.accuracy)));

    return {
      avgWPM: Math.round(avgWPM),
      avgAccuracy: Math.round(avgAccuracy),
      avgRetention: Math.round(avgRetention),
      avgSpeedLearning: Math.round(avgSpeedLearning),
      maxWPM: Math.round(maxWPM),
      maxAccuracy: Math.round(maxAccuracy),
      total: history.length
    };
  };

  const stats = calculateStats();

  if (loading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-96 mt-2" />
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-24" />
              ))}
            </div>
            <Skeleton className="h-96" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (history.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
      >
      <Card className="bg-gradient-to-br from-purple-50 to-blue-50 border-purple-200">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="bg-gradient-to-r from-purple-500 to-blue-500 p-6 rounded-full">
              <History className="h-12 w-12 text-white" />
            </div>
          </div>
          <CardTitle className="text-2xl">No Assessment History</CardTitle>
          <CardDescription className="text-lg">
            Complete assessments to see your progress over time
          </CardDescription>
        </CardHeader>
      </Card>
      </motion.div>
    );
  }

  return (
    <motion.div 
      className="space-y-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      {/* Header with Filters */}
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <CardTitle className="text-2xl flex items-center gap-2">
                <History className="h-6 w-6 text-purple-600" />
                Assessment History
              </CardTitle>
              <CardDescription>
                {stats?.total} assessment{stats?.total !== 1 ? 's' : ''} in the last {days} days
              </CardDescription>
            </div>
            
            <div className="flex flex-wrap gap-3">
              <Select value={difficulty} onValueChange={setDifficulty}>
                <SelectTrigger className="w-[140px]">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Levels</SelectItem>
                  <SelectItem value="easy">Easy</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="hard">Hard</SelectItem>
                </SelectContent>
              </Select>

              <Select value={days.toString()} onValueChange={(v) => setDays(parseInt(v))}>
                <SelectTrigger className="w-[140px]">
                  <Calendar className="h-4 w-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7">Last 7 days</SelectItem>
                  <SelectItem value="30">Last 30 days</SelectItem>
                  <SelectItem value="90">Last 90 days</SelectItem>
                  <SelectItem value="365">Last year</SelectItem>
                </SelectContent>
              </Select>

              <Button
                variant="outline"
                size="icon"
                onClick={() => setViewMode(viewMode === "chart" ? "table" : "chart")}
              >
                {viewMode === "chart" ? <BarChart3 className="h-4 w-4" /> : <LineChartIcon className="h-4 w-4" />}
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Stats Overview */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm text-purple-700 flex items-center gap-2">
                <Zap className="h-4 w-4" />
                Avg Speed
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-900">
                {stats.avgWPM} <span className="text-sm">WPM</span>
              </div>
              <p className="text-xs text-purple-600 mt-1">
                Peak: {stats.maxWPM} WPM
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm text-blue-700 flex items-center gap-2">
                <Target className="h-4 w-4" />
                Avg Accuracy
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-900">
                {stats.avgAccuracy}%
              </div>
              <p className="text-xs text-blue-600 mt-1">
                Peak: {stats.maxAccuracy}%
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm text-green-700 flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Avg Retention
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-900">
                {stats.avgRetention}%
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm text-yellow-700 flex items-center gap-2">
                <Award className="h-4 w-4" />
                Speed Learning
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-900">
                {stats.avgSpeedLearning}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Chart/Table View */}
      <Card>
        <CardContent className="pt-6">
          {viewMode === "chart" ? (
            <HistoryChart history={history} />
          ) : (
            <HistoryTable history={history} />
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};
