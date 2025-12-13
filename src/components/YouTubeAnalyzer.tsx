
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Youtube, Star, Video, Book, Loader2, Clock, Target, Play, BookOpen } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { getBackendUrl } from "@/lib/api-utils";
import { callBackend } from "@/lib/auth";
import { TranscriptViewer } from "./TranscriptViewer";
import { EnhancedStudyNotes } from "./EnhancedStudyNotes";

interface TranscriptSegment {
  text: string;
  offset: number;
  duration: number;
}

interface ConceptMetadata {
  conceptId: string;
  domain: string;
  conceptSlug: string;
  keywords: string[];
  learningObjective: string;
  userLinked: boolean;
}

interface AnalyzedVideo {
  id: string | number;
  title: string;
  url: string;
  duration: string;
  summary: string;
  keyTopics: string[];
  studyTime: string;
  difficulty: string;
  transcript: string; // "Available" | "Unavailable" for quick status display
  aiInsights: string;
  processing?: boolean;
  transcriptSegments?: TranscriptSegment[]; // raw segments returned by backend
  videoId?: string; // backend video identifier returned by /api/extract
  notesMarkdown?: string; // generated study material markdown
  notesProcessing?: boolean; // generation in progress
  concept?: ConceptMetadata; // concept metadata from backend
}

export const YouTubeAnalyzer = () => {
  const [videoUrl, setVideoUrl] = useState("");
  const [analyzedVideos, setAnalyzedVideos] = useState<AnalyzedVideo[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [viewingTranscript, setViewingTranscript] = useState<AnalyzedVideo | null>(null);
  const { toast } = useToast();

  const handleAnalyzeVideo = async () => {
    console.log('Analyze button clicked!');
    
    if (!videoUrl) {
      console.log('No video URL provided');
      return;
    }

    console.log('Video URL:', videoUrl);

    // Validate YouTube URL
    const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+/;
    if (!youtubeRegex.test(videoUrl)) {
      console.log('Invalid YouTube URL');
      toast({
        title: "Invalid URL",
        description: "Please enter a valid YouTube URL",
        variant: "destructive"
      });
      return;
    }
    
    console.log('URL validation passed');
    
    setIsAnalyzing(true);
    
    // Add processing video to the list immediately
    const processingVideo: AnalyzedVideo = {
      id: Date.now(),
      title: "Analyzing video...",
      url: videoUrl,
      duration: "Loading...",
      summary: "AI is processing the video transcript and content...",
      keyTopics: ["Analysis in progress..."],
      studyTime: "Calculating...",
      difficulty: "TBD",
      transcript: "Extracting...",
      aiInsights: "Please wait while we analyze the content and create your personalized study guide...",
      processing: true
    };
    
    setAnalyzedVideos(prev => [processingVideo, ...prev]);
    const currentUrl = videoUrl;
    setVideoUrl("");

    try {
      // Call the backend extract endpoint to fetch raw transcript
      const backendUrl = getBackendUrl();
      console.log('Attempting to analyze video:', { url: currentUrl, backendUrl });
      
      const data = await callBackend(`${backendUrl}/api/yt-study/extract`, {
        method: 'POST',
        body: JSON.stringify({ url: currentUrl }),
      });
      // data is expected to be: { status, videoId, transcript: [{ text, offset, duration }], message }
      const segments = Array.isArray(data?.transcript) ? data.transcript as TranscriptSegment[] : [];
      const mergedText = segments.map(s => s?.text).filter(Boolean).join(' ');

      // Update the processing video with transcript availability and raw segments for later use
      const analyzedVideo: AnalyzedVideo = {
        id: processingVideo.id,
        title: `YouTube Video (${data?.videoId ?? 'unknown'})`,
        url: currentUrl,
        duration: 'Unknown',
        summary: data?.message ?? 'Transcript fetched successfully.',
        keyTopics: [],
        studyTime: 'TBD',
        difficulty: 'TBD',
        transcript: mergedText ? 'Available' : 'Unavailable',
        aiInsights: 'Transcript fetched successfully. Further analysis pending.',
        processing: false,
        transcriptSegments: segments,
        videoId: data?.videoId,
      };

      setAnalyzedVideos(prev => prev.map(video => 
        video.id === processingVideo.id ? analyzedVideo : video
      ));

      toast({
        title: "Transcript fetched",
        description: "Raw transcript received from backend.",
      });

    } catch (error) {
      console.error('Error analyzing video:', error);
      
      // Remove the processing video and show error
      setAnalyzedVideos(prev => prev.filter(video => video.id !== processingVideo.id));
      
      let errorDescription = "Failed to analyze the video. Please try again.";
      
      if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
        errorDescription = "Cannot connect to backend server. Please ensure the backend is running.";
      } else if (error instanceof Error) {
        errorDescription = error.message;
      }
      
      toast({
        title: "Analysis failed",
        description: errorDescription,
        variant: "destructive"
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleCreateNotes = async (video: AnalyzedVideo) => {
    if (!video.videoId || !video.transcriptSegments || video.transcriptSegments.length === 0) {
      toast({
        title: "Transcript not available",
        description: "Please extract the transcript before generating notes.",
        variant: "destructive",
      });
      return;
    }

    // Mark this video's notes as processing
    setAnalyzedVideos(prev => prev.map(v => v.id === video.id ? { ...v, notesProcessing: true } : v));

    try {
      const backendUrl = getBackendUrl();
      const data = await callBackend(`${backendUrl}/api/yt-study/summarize`, {
        method: 'POST',
        body: JSON.stringify({
          videoId: video.videoId,
          transcript: video.transcriptSegments,
          language: 'en',
        }),
      });
      const markdown: string = data?.markdown || '';
      const concept: ConceptMetadata | undefined = data?.concept;

      setAnalyzedVideos(prev => prev.map(v => v.id === video.id ? { ...v, notesMarkdown: markdown, concept, notesProcessing: false } : v));

      toast({
        title: "Notes ready",
        description: data?.message || "Study material generated successfully.",
      });
    } catch (err) {
      console.error('Error generating notes:', err);
      setAnalyzedVideos(prev => prev.map(v => v.id === video.id ? { ...v, notesProcessing: false } : v));
      toast({
        title: "Failed to generate notes",
        description: err instanceof Error ? err.message : 'Unexpected error',
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="text-center space-y-2 sm:space-y-4 px-2">
        <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold bg-gradient-to-r from-red-500 to-purple-600 bg-clip-text text-transparent">
          YouTube Learning Assistant
        </h2>
        <p className="text-sm sm:text-base text-muted-foreground">
          Transform any educational video into a personalized study experience
        </p>
      </div>

      {/* Video URL Input */}
      <Card className="bg-gradient-to-br from-red-50 to-purple-50 border-red-200">
        <CardHeader className="p-4 sm:p-6">
          <CardTitle className="flex items-center space-x-2 text-base sm:text-lg">
            <Youtube className="h-5 w-5 sm:h-6 sm:w-6 text-red-500 flex-shrink-0" />
            <span>Analyze YouTube Video</span>
          </CardTitle>
          <CardDescription className="text-xs sm:text-sm">
            Paste any YouTube URL to extract transcripts and generate study materials
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 sm:space-y-4 p-4 sm:p-6 pt-0">
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-2">
            <Input
              placeholder="https://youtube.com/watch?v=..."
              value={videoUrl}
              onChange={(e) => setVideoUrl(e.target.value)}
              className="flex-1 text-sm"
            />
            <Button 
              onClick={handleAnalyzeVideo}
              className="bg-gradient-to-r from-red-500 to-purple-500 text-white hover:text-white w-full sm:w-auto whitespace-nowrap"
              disabled={!videoUrl || isAnalyzing}
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Analyzing...
                </>
              ) : (
                "Analyze"
              )}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            We'll extract the transcript, identify key concepts, and create personalized study materials
          </p>
        </CardContent>
      </Card>

      {/* Analyzed Videos */}
      <div className="space-y-3 sm:space-y-4">
        <h3 className="text-lg sm:text-xl font-semibold px-1">Your Video Library</h3>
        {analyzedVideos.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-8 sm:py-12 px-4">
              <Youtube className="h-10 w-10 sm:h-12 sm:w-12 text-muted-foreground mb-3 sm:mb-4" />
              <p className="text-sm sm:text-base text-muted-foreground text-center">
                No videos analyzed yet.<br />
                Paste a YouTube URL above to get started!
              </p>
            </CardContent>
          </Card>
        ) : (
          analyzedVideos.map((video) => (
          <Card key={video.id} className="hover:shadow-xl transition-all duration-300 border-l-4 border-l-red-500 bg-gradient-to-r from-white to-red-50">
            <CardHeader className="bg-gradient-to-r from-red-50 to-purple-50 p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3">
                <div className="flex-1 min-w-0">
                  <CardTitle className="flex items-start sm:items-center gap-2 flex-wrap text-base sm:text-lg">
                    <div className="p-1.5 sm:p-2 bg-red-500 rounded-lg flex-shrink-0">
                      <Video className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-white" />
                    </div>
                    <span className="text-gray-800 break-words">{video.title}</span>
                    {video.processing && (
                      <Loader2 className="h-4 w-4 animate-spin text-purple-600 flex-shrink-0" />
                    )}
                  </CardTitle>
                  <CardDescription className="mt-2 sm:mt-3 text-xs sm:text-sm text-gray-600 leading-relaxed">
                    {video.summary}
                  </CardDescription>
                </div>
                <div className="flex sm:flex-col items-center sm:items-end gap-2 sm:space-y-2">
                  <Badge 
                    variant="secondary" 
                    className={`text-xs ${
                      video.difficulty === 'Available' ? 'bg-green-100 text-green-700' : 
                      video.difficulty === 'TBD' ? 'bg-yellow-100 text-yellow-700' : 
                      'bg-blue-100 text-blue-700'
                    }`}
                  >
                    {video.difficulty}
                  </Badge>
                  <span className="text-xs text-muted-foreground font-medium">{video.duration}</span>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4 sm:space-y-6 p-4 sm:p-6">
              {/* Key Topics */}
              {video.keyTopics.length > 0 && (
                <div className="bg-white rounded-lg p-3 sm:p-4 border">
                  <div className="flex items-center space-x-2 mb-2 sm:mb-3">
                    <div className="p-1 bg-purple-100 rounded flex-shrink-0">
                      <Star className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-purple-600" />
                    </div>
                    <h4 className="font-semibold text-sm sm:text-base text-gray-800">Key Topics Covered</h4>
                  </div>
                  <div className="flex flex-wrap gap-1.5 sm:gap-2">
                    {video.keyTopics.map((topic, index) => (
                      <Badge 
                        key={index} 
                        variant="secondary" 
                        className="bg-gradient-to-r from-red-100 to-pink-100 text-red-700 hover:from-red-200 hover:to-pink-200 transition-colors text-xs"
                      >
                        {topic}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Transcript Status */}
              <div className={`flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-3 sm:p-4 rounded-lg border-2 ${
                video.transcript === "Available" 
                  ? "bg-gradient-to-r from-green-50 to-emerald-50 border-green-200" 
                  : video.transcript === "Extracting..." 
                    ? "bg-gradient-to-r from-yellow-50 to-amber-50 border-yellow-200" 
                    : "bg-gradient-to-r from-red-50 to-pink-50 border-red-200"
              }`}>
                <div className="flex items-center space-x-2 min-w-0">
                  <div className={`p-1.5 sm:p-2 rounded-lg flex-shrink-0 ${
                    video.transcript === "Available" 
                      ? "bg-green-500" 
                      : video.transcript === "Extracting..." 
                        ? "bg-yellow-500" 
                        : "bg-red-500"
                  }`}>
                    <Book className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-white" />
                  </div>
                  <div className="min-w-0">
                    <span className={`text-xs sm:text-sm font-semibold block ${
                      video.transcript === "Available" 
                        ? "text-green-800" 
                        : video.transcript === "Extracting..." 
                          ? "text-yellow-800" 
                          : "text-red-800"
                    }`}>
                      Transcript: {video.transcript}
                    </span>
                    <p className="text-xs text-gray-600 mt-0.5 sm:mt-1">
                      {video.transcript === "Available" 
                        ? "Ready for AI analysis" 
                        : video.transcript === "Extracting..." 
                          ? "Processing video content..." 
                          : "Unable to extract transcript"}
                    </p>
                  </div>
                </div>
                {video.transcript === "Available" && (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => setViewingTranscript(video)}
                    className="text-green-700 border-green-300 hover:bg-green-100 transition-colors w-full sm:w-auto text-xs sm:text-sm"
                  >
                    View Transcript
                  </Button>
                )}
              </div>

              {/* AI Insights */}
              <div className="bg-gradient-to-r from-indigo-50 to-purple-50 p-3 sm:p-5 rounded-lg border border-purple-200">
                <div className="flex items-center space-x-2 mb-2 sm:mb-3">
                  <div className="p-1.5 sm:p-2 bg-purple-500 rounded-lg flex-shrink-0">
                    <Star className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-white" />
                  </div>
                  <h4 className="font-semibold text-sm sm:text-base text-purple-900">AI Learning Recommendation</h4>
                </div>
                <p className="text-xs sm:text-sm text-purple-800 leading-relaxed">{video.aiInsights}</p>
              </div>

              {/* Study Notes (Enhanced) */}
              {video.notesMarkdown && (
                <EnhancedStudyNotes 
                  markdown={video.notesMarkdown}
                  concept={video.concept}
                />
              )}

              {/* Study Actions */}
              <div className="bg-gradient-to-r from-gray-50 to-blue-50 p-3 sm:p-4 rounded-lg border-t">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 sm:gap-0 mb-3 sm:mb-4">
                  <div className="flex items-center space-x-2">
                    <div className="p-1 bg-blue-100 rounded flex-shrink-0">
                      <Clock className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-blue-600" />
                    </div>
                    <span className="text-xs sm:text-sm font-medium text-gray-700">
                      Recommended study time: {video.studyTime}
                    </span>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    disabled={video.processing || video.notesProcessing || !(video.transcriptSegments && video.transcriptSegments.length > 0)}
                    onClick={() => handleCreateNotes(video)}
                    className="bg-white hover:bg-green-50 border-green-300 text-green-700 hover:border-green-400 transition-colors w-full text-xs sm:text-sm"
                  >
                    {video.notesProcessing ? (
                      <>
                        <Loader2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-2 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <BookOpen className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-2" />
                        Create Study Notes
                      </>
                    )}
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    size="sm" 
                    disabled={video.processing}
                    className="bg-white hover:bg-blue-50 border-blue-300 text-blue-700 hover:border-blue-400 transition-colors w-full text-xs sm:text-sm"
                  >
                    <Target className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-2" />
                    Generate Quiz
                  </Button>
                  
                  <Button 
                    size="sm" 
                    disabled={video.processing}
                    className="bg-gradient-to-r from-red-500 to-purple-600 hover:from-red-600 hover:to-purple-700 text-white hover:text-white shadow-lg transform hover:scale-105 transition-all w-full sm:col-span-2 lg:col-span-1 text-xs sm:text-sm"
                  >
                    <Play className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-2" />
                    Start Learning
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
          ))
        )}
      </div>

      {/* Feature Highlights */}
      <Card className="bg-gradient-to-r from-blue-500 to-purple-600 text-white">
        <CardContent className="p-4 sm:p-6">
          <h3 className="text-lg sm:text-xl font-bold mb-3 sm:mb-4">AI-Powered Video Analysis</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4 text-xs sm:text-sm">
            <div>
              <h4 className="font-semibold mb-1 text-sm sm:text-base">Smart Transcription</h4>
              <p className="text-blue-100">Automatic transcript extraction with key point identification</p>
            </div>
            <div>
              <h4 className="font-semibold mb-1 text-sm sm:text-base">Concept Mapping</h4>
              <p className="text-blue-100">Visual connections between related topics and ideas</p>
            </div>
            <div className="sm:col-span-2 md:col-span-1">
              <h4 className="font-semibold mb-1 text-sm sm:text-base">Adaptive Learning</h4>
              <p className="text-blue-100">Personalized study paths based on your learning style</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Transcript Viewer Modal */}
      {viewingTranscript && viewingTranscript.transcriptSegments && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 flex items-center justify-center p-4">
          <div className="w-full max-w-4xl">
            <TranscriptViewer
              segments={viewingTranscript.transcriptSegments}
              videoTitle={viewingTranscript.title}
              onClose={() => setViewingTranscript(null)}
            />
          </div>
        </div>
      )}
    </div>
  );
};
