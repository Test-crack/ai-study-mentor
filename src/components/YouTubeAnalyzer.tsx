
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Youtube, Star, Video, Book, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface AnalyzedVideo {
  id: string | number;
  title: string;
  url: string;
  duration: string;
  summary: string;
  keyTopics: string[];
  studyTime: string;
  difficulty: string;
  transcript: string;
  aiInsights: string;
  processing?: boolean;
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
      // Call the Supabase edge function
      const { data, error } = await supabase.functions.invoke('analyze-youtube', {
        body: { videoUrl: currentUrl }
      });

      if (error) {
        console.error('Analysis error:', error);
        throw new Error(error.message || 'Failed to analyze video');
      }

      const analysis = data.error ? data.fallback : data;
      
      // Update the processing video with real analysis
      const analyzedVideo: AnalyzedVideo = {
        id: processingVideo.id,
        title: analysis.title,
        url: currentUrl,
        duration: analysis.duration,
        summary: analysis.summary,
        keyTopics: analysis.keyTopics,
        studyTime: analysis.studyTime,
        difficulty: analysis.difficulty,
        transcript: analysis.transcript,
        aiInsights: analysis.aiInsights,
        processing: false
      };

      setAnalyzedVideos(prev => prev.map(video => 
        video.id === processingVideo.id ? analyzedVideo : video
      ));

      toast({
        title: "Analysis complete!",
        description: "Your video has been analyzed and study materials are ready.",
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

              {/* Study Actions */}
              <div className="flex justify-between items-center pt-4 border-t">
                <span className="text-sm text-muted-foreground">
                  Recommended study time: {video.studyTime}
                </span>
                  <div className="flex space-x-2">
                    <Button variant="outline" size="sm" disabled={video.processing}>
                      Create Notes
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
