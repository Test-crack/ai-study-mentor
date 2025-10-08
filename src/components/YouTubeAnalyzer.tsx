
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Youtube, Star, Video, Book, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface TranscriptSegment {
  text: string;
  offset: number;
  duration: number;
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
}

export const YouTubeAnalyzer = () => {
  const [videoUrl, setVideoUrl] = useState("");
  const [analyzedVideos, setAnalyzedVideos] = useState<AnalyzedVideo[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const { toast } = useToast();

  const handleAnalyzeVideo = async () => {
    if (!videoUrl) return;

    // Validate YouTube URL
    const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+/;
    if (!youtubeRegex.test(videoUrl)) {
      toast({
        title: "Invalid URL",
        description: "Please enter a valid YouTube URL",
        variant: "destructive"
      });
      return;
    }
    
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
      const backendUrl = (import.meta as any).env?.VITE_BACKEND_URL || 'http://localhost:4000';
      const response = await fetch(`${backendUrl}/api/yt-study/extract`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url: currentUrl }),
      });

      if (!response.ok) {
        let errorMessage = `Request failed with status ${response.status}`;
        try {
          const errJson = await response.json();
          if (errJson?.error) errorMessage = errJson.error;
        } catch {}
        console.error('Extract API error:', errorMessage);
        throw new Error(errorMessage);
      }

      const data = await response.json();
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
      
      toast({
        title: "Analysis failed",
        description: "Failed to analyze the video. Please try again.",
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
      const backendUrl = (import.meta as any).env?.VITE_BACKEND_URL || 'http://localhost:4000';
      const response = await fetch(`${backendUrl}/api/yt-study/summarize`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          videoId: video.videoId,
          transcript: video.transcriptSegments,
          language: 'en',
        }),
      });

      if (!response.ok) {
        let errorMessage = `Request failed with status ${response.status}`;
        try {
          const errJson = await response.json();
          if (errJson?.error) errorMessage = errJson.error;
        } catch {}
        throw new Error(errorMessage);
      }

      const data = await response.json();
      const markdown: string = data?.markdown || '';

      setAnalyzedVideos(prev => prev.map(v => v.id === video.id ? { ...v, notesMarkdown: markdown, notesProcessing: false } : v));

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
    <div className="space-y-6">
      <div className="text-center space-y-4">
        <h2 className="text-3xl font-bold bg-gradient-to-r from-red-500 to-purple-600 bg-clip-text text-transparent">
          YouTube Learning Assistant
        </h2>
        <p className="text-muted-foreground">
          Transform any educational video into a personalized study experience
        </p>
      </div>

      {/* Video URL Input */}
      <Card className="bg-gradient-to-br from-red-50 to-purple-50 border-red-200">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Youtube className="h-6 w-6 text-red-500" />
            <span>Analyze YouTube Video</span>
          </CardTitle>
          <CardDescription>
            Paste any YouTube URL to extract transcripts and generate study materials
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex space-x-2">
            <Input
              placeholder="https://youtube.com/watch?v=..."
              value={videoUrl}
              onChange={(e) => setVideoUrl(e.target.value)}
              className="flex-1"
            />
            <Button 
              onClick={handleAnalyzeVideo}
              className="bg-gradient-to-r from-red-500 to-purple-500"
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
      <div className="space-y-4">
        <h3 className="text-xl font-semibold">Your Video Library</h3>
        {analyzedVideos.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Youtube className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground text-center">
                No videos analyzed yet.<br />
                Paste a YouTube URL above to get started!
              </p>
            </CardContent>
          </Card>
        ) : (
          analyzedVideos.map((video) => (
          <Card key={video.id} className="hover:shadow-lg transition-all duration-300">
            <CardHeader>
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <CardTitle className="flex items-center space-x-2">
                    <Video className="h-5 w-5 text-red-500" />
                    <span>{video.title}</span>
                    {video.processing && (
                      <Loader2 className="h-4 w-4 animate-spin text-purple-600" />
                    )}
                  </CardTitle>
                  <CardDescription className="mt-2">{video.summary}</CardDescription>
                </div>
                <div className="flex flex-col items-end space-y-2">
                  <Badge variant="outline">{video.difficulty}</Badge>
                  <span className="text-xs text-muted-foreground">{video.duration}</span>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Key Topics */}
              <div>
                <h4 className="font-medium mb-2">Key Topics Covered</h4>
                <div className="flex flex-wrap gap-2">
                  {video.keyTopics.map((topic, index) => (
                    <Badge key={index} variant="secondary" className="bg-red-100 text-red-700">
                      {topic}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Transcript Status */}
              <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                <div className="flex items-center space-x-2">
                  <Book className="h-4 w-4 text-green-600" />
                  <span className="text-sm font-medium text-green-700">Transcript: {video.transcript}</span>
                </div>
                {video.transcript === "Available" && (
                  <Button variant="outline" size="sm" className="text-green-700 border-green-300">
                    View Transcript
                  </Button>
                )}
              </div>

              {/* AI Insights */}
              <div className="bg-gradient-to-r from-purple-50 to-blue-50 p-4 rounded-lg">
                <div className="flex items-center space-x-2 mb-2">
                  <Star className="h-4 w-4 text-purple-600" />
                  <h4 className="font-medium text-purple-800">Learning Recommendation</h4>
                </div>
                <p className="text-sm text-purple-700">{video.aiInsights}</p>
              </div>

              {/* Study Notes (Markdown) */}
              {video.notesMarkdown && (
                <div className="p-4 rounded-lg border bg-white">
                  <h4 className="font-medium mb-2">Study Notes</h4>
                  <pre className="whitespace-pre-wrap text-sm">{video.notesMarkdown}</pre>
                </div>
              )}

              {/* Study Actions */}
              <div className="flex justify-between items-center pt-4 border-t">
                <span className="text-sm text-muted-foreground">
                  Recommended study time: {video.studyTime}
                </span>
                  <div className="flex space-x-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      disabled={video.processing || video.notesProcessing || !(video.transcriptSegments && video.transcriptSegments.length > 0)}
                      onClick={() => handleCreateNotes(video)}
                    >
                      {video.notesProcessing ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Generating...
                        </>
                      ) : (
                        'Create Notes'
                      )}
                    </Button>
                    <Button variant="outline" size="sm" disabled={video.processing}>
                      Generate Quiz
                    </Button>
                    <Button size="sm" className="bg-gradient-to-r from-red-500 to-purple-500" disabled={video.processing}>
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
        <CardContent className="p-6">
          <h3 className="text-xl font-bold mb-2">AI-Powered Video Analysis</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <h4 className="font-semibold mb-1">Smart Transcription</h4>
              <p className="text-blue-100">Automatic transcript extraction with key point identification</p>
            </div>
            <div>
              <h4 className="font-semibold mb-1">Concept Mapping</h4>
              <p className="text-blue-100">Visual connections between related topics and ideas</p>
            </div>
            <div>
              <h4 className="font-semibold mb-1">Adaptive Learning</h4>
              <p className="text-blue-100">Personalized study paths based on your learning style</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
