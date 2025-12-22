import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/components/ui/table";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/shared/components/ui/dialog";
import { Progress } from "@/shared/components/ui/progress";
import { type AssessmentHistoryItem } from "@/features/reading-assessment/services/reading-api";
import { Eye, Clock, Target, Zap, Award, Shield } from "lucide-react";

interface HistoryTableProps {
  history: AssessmentHistoryItem[];
}

export const HistoryTable = ({ history }: HistoryTableProps) => {
  const [selectedItem, setSelectedItem] = useState<AssessmentHistoryItem | null>(null);

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty.toLowerCase()) {
      case 'easy': return 'bg-green-500';
      case 'medium': return 'bg-yellow-500';
      case 'hard': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getScoreColor = (score: number, max: number = 100) => {
    // Handle both decimal (0-1) and percentage (0-100) formats
    const normalizedScore = score <= 1 ? score * 100 : score;
    const percentage = (normalizedScore / max) * 100;
    if (percentage >= 80) return "text-green-600";
    if (percentage >= 60) return "text-blue-600";
    if (percentage >= 40) return "text-yellow-600";
    return "text-orange-600";
  };

  const formatScore = (score: number) => {
    // Convert to percentage if it's in decimal format
    return score <= 1 ? Math.round(score * 100) : Math.round(score);
  };

  const getDateString = (item: AssessmentHistoryItem) => {
    return item.completedAt || item.createdAt || new Date().toISOString();
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50">
              <TableHead className="font-semibold">Date</TableHead>
              <TableHead className="font-semibold">Passage</TableHead>
              <TableHead className="font-semibold">Difficulty</TableHead>
              <TableHead className="font-semibold text-right">Speed (WPM)</TableHead>
              <TableHead className="font-semibold text-right">Accuracy</TableHead>
              <TableHead className="font-semibold text-right">Retention</TableHead>
              <TableHead className="font-semibold text-right">Time</TableHead>
              <TableHead className="font-semibold text-center">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {history.map((item) => (
              <TableRow key={item.id} className="hover:bg-gray-50">
                <TableCell className="font-medium">
                  <div className="flex flex-col">
                    <span className="text-sm">
                      {new Date(getDateString(item)).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </span>
                    <span className="text-xs text-gray-500">
                      {new Date(getDateString(item)).toLocaleTimeString('en-US', {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="max-w-xs">
                    <p className="font-medium text-sm truncate">
                      {item.passageTitle || `${item.category} Passage`}
                    </p>
                    <p className="text-xs text-gray-500">{item.category}</p>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge className={`${getDifficultyColor(item.difficulty)} text-white`}>
                    {item.difficulty}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <span className={`font-semibold ${getScoreColor(item.weightedWPM, 400)}`}>
                    {Math.round(item.weightedWPM)}
                  </span>
                </TableCell>
                <TableCell className="text-right">
                  <span className={`font-semibold ${getScoreColor(item.accuracy)}`}>
                    {formatScore(item.accuracy)}%
                  </span>
                </TableCell>
                <TableCell className="text-right">
                  <span className={`font-semibold ${getScoreColor(item.retention)}`}>
                    {formatScore(item.retention)}%
                  </span>
                </TableCell>
                <TableCell className="text-right text-sm text-gray-600">
                  {formatTime(item.readingTimeSeconds)}
                </TableCell>
                <TableCell className="text-center">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedItem(item)}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Detail Dialog */}
      <Dialog open={!!selectedItem} onOpenChange={() => setSelectedItem(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl">
              {selectedItem?.passageTitle || `${selectedItem?.category} Passage`}
            </DialogTitle>
            <DialogDescription>
              {selectedItem && new Date(getDateString(selectedItem)).toLocaleString('en-US', {
                month: 'long',
                day: 'numeric',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </DialogDescription>
          </DialogHeader>

          {selectedItem && (
            <div className="space-y-6 mt-4">
              {/* Basic Info */}
              <div className="flex gap-2">
                <Badge className={`${getDifficultyColor(selectedItem.difficulty)} text-white`}>
                  {selectedItem.difficulty}
                </Badge>
                <Badge variant="outline">{selectedItem.category}</Badge>
              </div>

              {/* Metrics Grid */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-purple-50 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Zap className="h-4 w-4 text-purple-600" />
                    <span className="text-sm font-medium text-purple-700">Reading Speed</span>
                  </div>
                  <div className="text-2xl font-bold text-purple-900">
                    {Math.round(selectedItem.weightedWPM)} <span className="text-sm">WPM</span>
                  </div>
                  <Progress 
                    value={Math.min((selectedItem.weightedWPM / 400) * 100, 100)} 
                    className="h-2 mt-2 bg-purple-200"
                  />
                </div>

                <div className="p-4 bg-blue-50 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Target className="h-4 w-4 text-blue-600" />
                    <span className="text-sm font-medium text-blue-700">Accuracy</span>
                  </div>
                  <div className="text-2xl font-bold text-blue-900">
                    {formatScore(selectedItem.accuracy)}%
                  </div>
                  <Progress 
                    value={formatScore(selectedItem.accuracy)} 
                    className="h-2 mt-2 bg-blue-200"
                  />
                </div>

                <div className="p-4 bg-green-50 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Award className="h-4 w-4 text-green-600" />
                    <span className="text-sm font-medium text-green-700">Retention</span>
                  </div>
                  <div className="text-2xl font-bold text-green-900">
                    {formatScore(selectedItem.retention)}%
                  </div>
                  <Progress 
                    value={formatScore(selectedItem.retention)} 
                    className="h-2 mt-2 bg-green-200"
                  />
                </div>

                <div className="p-4 bg-yellow-50 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Clock className="h-4 w-4 text-yellow-600" />
                    <span className="text-sm font-medium text-yellow-700">Reading Time</span>
                  </div>
                  <div className="text-2xl font-bold text-yellow-900">
                    {formatTime(selectedItem.readingTimeSeconds)}
                  </div>
                </div>
              </div>

              {/* Advanced Metrics */}
              <div className="border-t pt-4">
                <h4 className="font-semibold mb-3">Advanced Metrics</h4>
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <div className="text-sm text-gray-600 mb-1">Speed Learning</div>
                    <div className="text-xl font-bold text-gray-900">
                      {formatScore(selectedItem.speedLearningScore)}
                    </div>
                  </div>

                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <div className="text-sm text-gray-600 mb-1">Focus Ratio</div>
                    <div className="text-xl font-bold text-gray-900">
                      {formatScore(selectedItem.focusRatio)}%
                    </div>
                  </div>

                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <div className="text-sm text-gray-600 mb-1 flex items-center justify-center gap-1">
                      <Shield className="h-3 w-3" />
                      Integrity
                    </div>
                    <div className="text-xl font-bold text-gray-900">
                      {formatScore(selectedItem.integrityScore)}%
                    </div>
                  </div>
                </div>
              </div>

              {/* Performance Summary */}
              <div className="bg-gradient-to-r from-purple-500 to-blue-500 p-4 rounded-lg text-white">
                <h4 className="font-semibold mb-2">Performance Summary</h4>
                <p className="text-sm text-purple-50">
                  {formatScore(selectedItem.accuracy) >= 80 && selectedItem.weightedWPM >= 200
                    ? "Excellent performance! You demonstrated both speed and comprehension."
                    : formatScore(selectedItem.accuracy) >= 80
                    ? "Great comprehension! Focus on gradually increasing your reading speed."
                    : selectedItem.weightedWPM >= 200
                    ? "Good reading speed! Work on improving comprehension for better retention."
                    : "Keep practicing! Both speed and comprehension will improve with consistent effort."}
                </p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};
