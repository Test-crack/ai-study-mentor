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
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <div className={`p-3 bg-gradient-to-r ${config.gradient} rounded-lg`}>
              <Icon className="h-6 w-6 text-white" />
            </div>
            <div>
              <CardTitle className="text-xl">{config.title}</CardTitle>
              <div className="flex items-center space-x-2 mt-1">
                <Badge className={`bg-gradient-to-r ${config.gradient} text-white`}>
                  {config.badge}
                </Badge>
                <span className="text-sm text-muted-foreground">
                  {note.fileName}
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownload}
              className="flex items-center space-x-1"
            >
              <Download className="h-4 w-4" />
              <span>Download</span>
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
        <div className="flex items-center space-x-2 text-xs text-muted-foreground mt-2">
          <Clock className="h-3 w-3" />
          <span>Generated {new Date(note.timestamp).toLocaleString()}</span>
        </div>
      </CardHeader>
      
      <CardContent>
        <MarkdownRenderer 
          content={note.markdown} 
          showTitle={false}
          className="shadow-none border"
        />
      </CardContent>
    </Card>
  );
}
