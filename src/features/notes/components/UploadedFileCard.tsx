import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Button } from "@/shared/components/ui/button";
import { Badge } from "@/shared/components/ui/badge";
import { 
  FileText, 
  Zap, 
  BookOpen, 
  Microscope, 
  Brain,
  CheckCircle2,
  Loader2
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
  isGeneratingOverview?: boolean;
  isGeneratingStandard?: boolean;
  isGeneratingDeepDive?: boolean;
}

export default function UploadedFileCard({
  fileInfo,
  onGenerateOverview,
  onGenerateStandardNotes,
  onGenerateDeepDive,
  onGenerateQuiz,
  isGeneratingOverview = false,
  isGeneratingStandard = false,
  isGeneratingDeepDive = false
}: UploadedFileCardProps) {
  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  };

  return (
    <Card className="bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 border-2 border-green-200 shadow-lg">
      <CardHeader className="p-4 sm:p-6">
        <div className="flex items-start gap-2 sm:gap-3">
          <div className="p-1.5 sm:p-2 bg-green-100 rounded-lg flex-shrink-0">
            <CheckCircle2 className="h-5 w-5 sm:h-6 sm:w-6 text-green-600" />
          </div>
          <div className="min-w-0 flex-1">
            <CardTitle className="text-base sm:text-lg break-words">{fileInfo.name}</CardTitle>
            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mt-1">
              <Badge variant="secondary" className="bg-green-100 text-green-700 text-xs">
                {fileInfo.type}
              </Badge>
              <span className="text-xs sm:text-sm text-muted-foreground">
                {formatFileSize(fileInfo.size)}
              </span>
            </div>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-3 sm:space-y-4 p-4 sm:p-6 pt-0">
        <div className="flex items-center gap-2 text-xs sm:text-sm text-green-700 bg-green-100 px-3 py-2 rounded-lg">
          <FileText className="h-3.5 w-3.5 sm:h-4 sm:w-4 flex-shrink-0" />
          <span className="leading-tight">Text extraction complete - Ready for AI processing</span>
        </div>

        <div className="space-y-2 sm:space-y-3">
          <p className="text-xs sm:text-sm font-medium text-muted-foreground">
            Choose how you want to process this file:
          </p>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
            <Button
              onClick={onGenerateOverview}
              disabled={isGeneratingOverview}
              className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 h-auto py-3 sm:py-4 flex flex-col items-start gap-1 disabled:opacity-70 text-left"
            >
              <div className="flex items-center gap-2">
                {isGeneratingOverview ? (
                  <Loader2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 animate-spin flex-shrink-0" />
                ) : (
                  <Zap className="h-3.5 w-3.5 sm:h-4 sm:w-4 flex-shrink-0" />
                )}
                <span className="font-semibold text-sm sm:text-base">Quick Overview</span>
              </div>
              <span className="text-xs opacity-90 font-normal">
                {isGeneratingOverview ? 'Generating...' : 'Fast summary of key points'}
              </span>
            </Button>

            <Button
              onClick={onGenerateStandardNotes}
              disabled={isGeneratingStandard}
              className="bg-gradient-to-r from-brand-blue-500 to-pink-500 hover:from-brand-blue-600 hover:to-pink-600 h-auto py-3 sm:py-4 flex flex-col items-start gap-1 disabled:opacity-70 text-left"
            >
              <div className="flex items-center gap-2">
                {isGeneratingStandard ? (
                  <Loader2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 animate-spin flex-shrink-0" />
                ) : (
                  <BookOpen className="h-3.5 w-3.5 sm:h-4 sm:w-4 flex-shrink-0" />
                )}
                <span className="font-semibold text-sm sm:text-base">Standard Notes</span>
              </div>
              <span className="text-xs opacity-90 font-normal">
                {isGeneratingStandard ? 'Generating...' : 'Comprehensive study notes'}
              </span>
            </Button>

            <Button
              onClick={onGenerateDeepDive}
              disabled={isGeneratingDeepDive}
              className="bg-gradient-to-r from-brand-teal-500 to-brand-blue-500 hover:from-brand-teal-600 hover:to-brand-blue-600 h-auto py-3 sm:py-4 flex flex-col items-start gap-1 disabled:opacity-70 text-left"
            >
              <div className="flex items-center gap-2">
                {isGeneratingDeepDive ? (
                  <Loader2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 animate-spin flex-shrink-0" />
                ) : (
                  <Microscope className="h-3.5 w-3.5 sm:h-4 sm:w-4 flex-shrink-0" />
                )}
                <span className="font-semibold text-sm sm:text-base">Deep Dive</span>
              </div>
              <span className="text-xs opacity-90 font-normal">
                {isGeneratingDeepDive ? 'Generating...' : 'In-depth analysis & insights'}
              </span>
            </Button>

            <Button
              onClick={onGenerateQuiz}
              className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 h-auto py-3 sm:py-4 flex flex-col items-start gap-1 text-left"
            >
              <div className="flex items-center gap-2">
                <Brain className="h-3.5 w-3.5 sm:h-4 sm:w-4 flex-shrink-0" />
                <span className="font-semibold text-sm sm:text-base">Quiz</span>
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
