import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  FileText, 
  Zap, 
  BookOpen, 
  Microscope, 
  Brain,
  CheckCircle2
} from "lucide-react";

interface FileInfo {
  name: string;
  originalPath: string;
  extractedPath: string;
  type: string;
  size: number;
  lastModified: number;
}

interface UploadedFileCardProps {
  fileInfo: FileInfo;
  onGenerateOverview: () => void;
  onGenerateStandardNotes: () => void;
  onGenerateDeepDive: () => void;
  onGenerateQuiz: () => void;
}

export default function UploadedFileCard({
  fileInfo,
  onGenerateOverview,
  onGenerateStandardNotes,
  onGenerateDeepDive,
  onGenerateQuiz
}: UploadedFileCardProps) {
  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  };

  return (
    <Card className="bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 border-2 border-green-200 shadow-lg">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircle2 className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <CardTitle className="text-lg">{fileInfo.name}</CardTitle>
              <div className="flex items-center space-x-2 mt-1">
                <Badge variant="secondary" className="bg-green-100 text-green-700">
                  {fileInfo.type}
                </Badge>
                <span className="text-sm text-muted-foreground">
                  {formatFileSize(fileInfo.size)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="flex items-center space-x-2 text-sm text-green-700 bg-green-100 px-3 py-2 rounded-lg">
          <FileText className="h-4 w-4" />
          <span>Text extraction complete - Ready for AI processing</span>
        </div>

        <div className="space-y-3">
          <p className="text-sm font-medium text-muted-foreground">
            Choose how you want to process this file:
          </p>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Button
              onClick={onGenerateOverview}
              className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 h-auto py-4 flex flex-col items-start space-y-1"
            >
              <div className="flex items-center space-x-2">
                <Zap className="h-4 w-4" />
                <span className="font-semibold">Quick Overview</span>
              </div>
              <span className="text-xs opacity-90 font-normal">
                Fast summary of key points
              </span>
            </Button>

            <Button
              onClick={onGenerateStandardNotes}
              className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 h-auto py-4 flex flex-col items-start space-y-1"
            >
              <div className="flex items-center space-x-2">
                <BookOpen className="h-4 w-4" />
                <span className="font-semibold">Standard Notes</span>
              </div>
              <span className="text-xs opacity-90 font-normal">
                Comprehensive study notes
              </span>
            </Button>

            <Button
              onClick={onGenerateDeepDive}
              className="bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 h-auto py-4 flex flex-col items-start space-y-1"
            >
              <div className="flex items-center space-x-2">
                <Microscope className="h-4 w-4" />
                <span className="font-semibold">Deep Dive</span>
              </div>
              <span className="text-xs opacity-90 font-normal">
                In-depth analysis & insights
              </span>
            </Button>

            <Button
              onClick={onGenerateQuiz}
              className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 h-auto py-4 flex flex-col items-start space-y-1"
            >
              <div className="flex items-center space-x-2">
                <Brain className="h-4 w-4" />
                <span className="font-semibold">Quiz</span>
              </div>
              <span className="text-xs opacity-90 font-normal">
                Test your knowledge
              </span>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
