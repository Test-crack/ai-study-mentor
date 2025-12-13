import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  X, 
  Search, 
  Clock, 
  Copy, 
  Download, 
  ChevronDown, 
  ChevronUp,
  FileText,
  Maximize2,
  Minimize2
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface TranscriptSegment {
  text: string;
  offset: number;
  duration: number;
}

interface TranscriptViewerProps {
  segments: TranscriptSegment[];
  videoTitle?: string;
  onClose: () => void;
}

export const TranscriptViewer = ({ segments, videoTitle, onClose }: TranscriptViewerProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [isExpanded, setIsExpanded] = useState(false);
  const { toast } = useToast();

  // Format time from seconds to MM:SS
  const formatTime = (seconds: number) => {
    const totalSeconds = Math.floor(seconds);
    const minutes = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  // Filter segments based on search query
  const filteredSegments = segments.filter(segment =>
    segment.text.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Copy full transcript to clipboard
  const handleCopyTranscript = () => {
    const fullText = segments.map(s => s.text).join(' ');
    navigator.clipboard.writeText(fullText);
    toast({
      title: "Copied!",
      description: "Transcript copied to clipboard",
    });
  };

  // Download transcript as text file
  const handleDownloadTranscript = () => {
    const content = segments
      .map(s => `[${formatTime(s.offset)}] ${s.text}`)
      .join('\n\n');
    
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `transcript-${videoTitle || 'video'}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast({
      title: "Downloaded!",
      description: "Transcript saved as text file",
    });
  };

  const totalDuration = segments.length > 0 
    ? formatTime(segments[segments.length - 1].offset + segments[segments.length - 1].duration)
    : "0:00";

  return (
    <Card className={`${isExpanded ? 'fixed inset-4 z-50' : 'relative'} bg-white shadow-2xl border-2 border-purple-200 transition-all duration-300`}>
      <CardHeader className="bg-gradient-to-r from-purple-50 to-blue-50 border-b p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="p-2 bg-purple-500 rounded-lg flex-shrink-0">
              <FileText className="h-5 w-5 text-white" />
            </div>
            <div className="min-w-0 flex-1">
              <CardTitle className="text-lg sm:text-xl text-gray-800 truncate">
                Video Transcript
              </CardTitle>
              {videoTitle && (
                <p className="text-xs sm:text-sm text-muted-foreground mt-1 truncate">
                  {videoTitle}
                </p>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="bg-purple-100 text-purple-700 text-xs">
              <Clock className="h-3 w-3 mr-1" />
              {totalDuration}
            </Badge>
            <Badge variant="secondary" className="bg-blue-100 text-blue-700 text-xs">
              {segments.length} segments
            </Badge>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="hidden sm:flex"
            >
              {isExpanded ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Search and Actions */}
        <div className="flex flex-col sm:flex-row gap-2 mt-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search transcript..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 text-sm"
            />
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopyTranscript}
              className="flex-1 sm:flex-none text-xs sm:text-sm"
            >
              <Copy className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Copy</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownloadTranscript}
              className="flex-1 sm:flex-none text-xs sm:text-sm"
            >
              <Download className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Download</span>
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        <ScrollArea className={`${isExpanded ? 'h-[calc(100vh-16rem)]' : 'h-[500px]'} w-full`}>
          <div className="p-4 sm:p-6 space-y-3">
            {filteredSegments.length === 0 ? (
              <div className="text-center py-12">
                <Search className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">
                  {searchQuery ? "No matching segments found" : "No transcript available"}
                </p>
              </div>
            ) : (
              filteredSegments.map((segment, index) => (
                <TranscriptSegmentCard
                  key={index}
                  segment={segment}
                  index={index}
                  searchQuery={searchQuery}
                />
              ))
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

interface TranscriptSegmentCardProps {
  segment: TranscriptSegment;
  index: number;
  searchQuery: string;
}

const TranscriptSegmentCard = ({ segment, index, searchQuery }: TranscriptSegmentCardProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const { toast } = useToast();

  const formatTime = (seconds: number) => {
    const totalSeconds = Math.floor(seconds);
    const minutes = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const handleCopySegment = () => {
    navigator.clipboard.writeText(segment.text);
    toast({
      title: "Copied!",
      description: "Segment copied to clipboard",
    });
  };

  // Highlight search query in text
  const highlightText = (text: string, query: string) => {
    if (!query) return text;
    
    const parts = text.split(new RegExp(`(${query})`, 'gi'));
    return parts.map((part, i) => 
      part.toLowerCase() === query.toLowerCase() 
        ? <mark key={i} className="bg-yellow-200 px-1 rounded">{part}</mark>
        : part
    );
  };

  const isLongText = segment.text.length > 200;
  const displayText = isLongText && !isExpanded 
    ? segment.text.substring(0, 200) + '...'
    : segment.text;

  return (
    <div className="group bg-gradient-to-r from-gray-50 to-blue-50 hover:from-purple-50 hover:to-blue-100 rounded-lg p-4 border border-gray-200 hover:border-purple-300 transition-all duration-200">
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0">
          <Badge 
            variant="secondary" 
            className="bg-purple-500 text-white hover:bg-purple-600 cursor-pointer text-xs"
          >
            <Clock className="h-3 w-3 mr-1" />
            {formatTime(segment.offset)}
          </Badge>
        </div>
        
        <div className="flex-1 min-w-0">
          <p className="text-sm sm:text-base text-gray-700 leading-relaxed">
            {highlightText(displayText, searchQuery)}
          </p>
          
          {isLongText && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="mt-2 text-xs text-purple-600 hover:text-purple-700 p-0 h-auto"
            >
              {isExpanded ? (
                <>
                  <ChevronUp className="h-3 w-3 mr-1" />
                  Show less
                </>
              ) : (
                <>
                  <ChevronDown className="h-3 w-3 mr-1" />
                  Show more
                </>
              )}
            </Button>
          )}
        </div>

        <Button
          variant="ghost"
          size="sm"
          onClick={handleCopySegment}
          className="opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
        >
          <Copy className="h-4 w-4 text-gray-500" />
        </Button>
      </div>
    </div>
  );
};
