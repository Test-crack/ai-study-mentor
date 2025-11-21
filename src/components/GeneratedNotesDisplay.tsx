import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MarkdownRenderer } from "@/components/ui/markdown-renderer";
import { 
  Zap, 
  BookOpen, 
  Microscope, 
  Download,
  X,
  Clock
} from "lucide-react";

interface GeneratedNote {
  materialType: 'overview' | 'standard' | 'detailed';
  markdown: string;
  fileName: string;
  timestamp: number;
}

interface GeneratedNotesDisplayProps {
  note: GeneratedNote;
  onClose: () => void;
}

const materialTypeConfig = {
  overview: {
    title: "Quick Overview",
    icon: Zap,
    gradient: "from-blue-500 to-cyan-500",
    bgGradient: "from-blue-50 to-cyan-50",
    badge: "Fast Summary"
  },
  standard: {
    title: "Standard Notes",
    icon: BookOpen,
    gradient: "from-purple-500 to-pink-500",
    bgGradient: "from-purple-50 to-pink-50",
    badge: "Comprehensive"
  },
  detailed: {
    title: "Deep Dive",
    icon: Microscope,
    gradient: "from-indigo-500 to-purple-500",
    bgGradient: "from-indigo-50 to-purple-50",
    badge: "In-Depth"
  }
};

export default function GeneratedNotesDisplay({ note, onClose }: GeneratedNotesDisplayProps) {
  const config = materialTypeConfig[note.materialType];
  const Icon = config.icon;

  const handleDownload = () => {
    const blob = new Blob([note.markdown], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${note.fileName}-${note.materialType}-notes.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <Card className={`bg-gradient-to-br ${config.bgGradient} border-2 shadow-xl`}>
      <CardHeader className="p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
          <div className="flex items-start gap-2 sm:gap-3 min-w-0 flex-1">
            <div className={`p-2 sm:p-3 bg-gradient-to-r ${config.gradient} rounded-lg flex-shrink-0`}>
              <Icon className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
            </div>
            <div className="min-w-0 flex-1">
              <CardTitle className="text-base sm:text-lg md:text-xl">{config.title}</CardTitle>
              <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 mt-1">
                <Badge className={`bg-gradient-to-r ${config.gradient} text-white text-xs w-fit`}>
                  {config.badge}
                </Badge>
                <span className="text-xs sm:text-sm text-muted-foreground truncate">
                  {note.fileName}
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 self-end sm:self-start">
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownload}
              className="flex items-center gap-1 text-xs sm:text-sm"
            >
              <Download className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Download</span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="hover:bg-red-100"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground mt-2 sm:mt-3">
          <Clock className="h-3 w-3 flex-shrink-0" />
          <span className="truncate">Generated {new Date(note.timestamp).toLocaleString()}</span>
        </div>
      </CardHeader>
      
      <CardContent className="p-4 sm:p-6 pt-0">
        <MarkdownRenderer 
          content={note.markdown} 
          showTitle={false}
          className="shadow-none border"
        />
      </CardContent>
    </Card>
  );
}
