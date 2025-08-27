import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { videoUrl } = await req.json();
    console.log('Analyzing YouTube video:', videoUrl);
    
    if (!videoUrl) {
      return new Response(JSON.stringify({ error: 'Video URL is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Extract video ID from various YouTube URL formats
    const getVideoId = (url: string) => {
      const patterns = [
        /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
        /youtube\.com\/watch\?.*v=([^&\n?#]+)/
      ];
      
      for (const pattern of patterns) {
        const match = url.match(pattern);
        if (match) return match[1];
      }
      return null;
    };

    const videoId = getVideoId(videoUrl);
    if (!videoId) {
      return new Response(JSON.stringify({ 
        error: 'Invalid YouTube URL format',
        fallback: {
          title: "Invalid URL",
          summary: "Please provide a valid YouTube URL",
          keyTopics: ["Error"],
          transcript: "Not available",
          duration: "0:00",
          difficulty: "N/A",
          studyTime: "0 min",
          aiInsights: "Please check the URL and try again."
        }
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get video metadata using YouTube oEmbed API (no API key required)
    let videoTitle = "YouTube Video";
    let duration = "Unknown";
    
    try {
      const oembedResponse = await fetch(`https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`);
      if (oembedResponse.ok) {
        const oembedData = await oembedResponse.json();
        videoTitle = oembedData.title || "YouTube Video";
      }
    } catch (error) {
      console.log('Failed to fetch video metadata:', error);
    }

    // For demo purposes, we'll simulate transcript extraction
    // In production, you'd use the YouTube Data API or a transcript extraction service
    const simulatedTranscript = `This is a simulated transcript for the video: ${videoTitle}. 
    The video covers important educational content that can be analyzed by AI to provide study insights.
    Key concepts include: methodology, analysis, examples, and practical applications.
    The content is structured to help learners understand complex topics through clear explanations.`;

    // Analyze with OpenAI
    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openAIApiKey) {
      console.error('OpenAI API key not found');
      return new Response(JSON.stringify({
        error: 'OpenAI API key not configured',
        fallback: {
          title: videoTitle,
          summary: "AI analysis temporarily unavailable. Please try again later.",
          keyTopics: ["Configuration Error"],
          transcript: "Available (simulated)",
          duration: duration,
          difficulty: "Unknown",
          studyTime: "15 min",
          aiInsights: "OpenAI integration needs to be configured for full analysis."
        }
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const prompt = `
Analyze this YouTube video transcript and provide educational insights:

Title: ${videoTitle}
Transcript: ${simulatedTranscript}

Please respond with a JSON object containing:
{
  "title": "Video title",
  "summary": "2-3 sentence summary of main concepts",
  "keyTopics": ["topic1", "topic2", "topic3"] (3-5 key topics),
  "transcript": "Available",
  "duration": "Estimated duration",
  "difficulty": "Beginner/Intermediate/Advanced",
  "studyTime": "X min" (recommended study time),
  "aiInsights": "Specific learning recommendations and study tips"
}

Focus on educational value and learning recommendations.`;

    const openAIResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { 
            role: 'system', 
            content: 'You are an educational AI assistant that analyzes video content to help students learn more effectively. Always respond with valid JSON.' 
          },
          { role: 'user', content: prompt }
        ],
        max_tokens: 1000,
        temperature: 0.3,
      }),
    });

    if (!openAIResponse.ok) {
      throw new Error(`OpenAI API error: ${openAIResponse.status}`);
    }

    const openAIData = await openAIResponse.json();
    const analysisText = openAIData.choices[0].message.content;
    
    console.log('Raw AI response:', analysisText);
    
    // Parse the JSON response
    let analysis;
    try {
      // Clean the response to extract JSON
      const jsonMatch = analysisText.match(/\{[\s\S]*\}/);
      const jsonString = jsonMatch ? jsonMatch[0] : analysisText;
      analysis = JSON.parse(jsonString);
    } catch (parseError) {
      console.error('Failed to parse AI response:', parseError);
      
      // Fallback response
      analysis = {
        title: videoTitle,
        summary: "This video contains educational content that can help with your studies. The AI analysis encountered a parsing issue, but the content is ready for review.",
        keyTopics: ["Educational Content", "Learning Material", "Study Resource"],
        transcript: "Available",
        duration: duration,
        difficulty: "Intermediate",
        studyTime: "20 min",
        aiInsights: "This video appears to contain valuable educational content. Consider taking notes while watching and reviewing key concepts afterward."
      };
    }

    // Ensure all required fields are present
    const finalAnalysis = {
      title: analysis.title || videoTitle,
      summary: analysis.summary || "Educational content ready for analysis",
      keyTopics: Array.isArray(analysis.keyTopics) ? analysis.keyTopics : ["Educational Content"],
      transcript: analysis.transcript || "Available",
      duration: analysis.duration || duration,
      difficulty: analysis.difficulty || "Intermediate",
      studyTime: analysis.studyTime || "15 min",
      aiInsights: analysis.aiInsights || "This video contains valuable educational content for study."
    };

    console.log('Final analysis:', finalAnalysis);

    return new Response(JSON.stringify(finalAnalysis), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in analyze-youtube function:', error);
    
    return new Response(JSON.stringify({
      error: error.message,
      fallback: {
        title: "Analysis Error",
        summary: "Failed to analyze the video. Please check the URL and try again.",
        keyTopics: ["Error"],
        transcript: "Not available",
        duration: "0:00",
        difficulty: "Unknown",
        studyTime: "0 min",
        aiInsights: "There was an error analyzing this video. Please try again with a different video or check your internet connection."
      }
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});