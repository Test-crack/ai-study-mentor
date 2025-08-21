import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { fileContent, fileName, fileType } = await req.json();
    
    console.log('Analyzing document:', fileName, 'Type:', fileType);

    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openAIApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    // Create AI prompt for document analysis
    const analysisPrompt = `
      Analyze the following document content and provide:
      1. A concise summary (2-3 sentences)
      2. Key topics (array of 3-5 main topics)
      3. Difficulty level (Beginner, Intermediate, or Advanced)
      4. Estimated study time in minutes
      5. AI insights for better learning

      Document content:
      ${fileContent}

      Please respond with a JSON object in this exact format:
      {
        "summary": "Your summary here",
        "keyTopics": ["topic1", "topic2", "topic3"],
        "difficultyLevel": "Beginner|Intermediate|Advanced",
        "estimatedStudyTime": number_in_minutes,
        "aiInsights": "Your learning insights and recommendations"
      }
    `;

    // Call OpenAI API
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
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
            content: 'You are an educational AI assistant that analyzes study materials and provides learning insights. Always respond with valid JSON.'
          },
          {
            role: 'user',
            content: analysisPrompt
          }
        ],
        temperature: 0.7,
        max_tokens: 1000,
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('OpenAI API error:', errorData);
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const aiResponse = await response.json();
    const analysisText = aiResponse.choices[0].message.content;
    
    console.log('Raw AI response:', analysisText);

    // Parse the AI response
    let analysis;
    try {
      // Try to extract JSON from the response
      const jsonMatch = analysisText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        analysis = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON found in response');
      }
    } catch (parseError) {
      console.error('Error parsing AI response:', parseError);
      // Fallback analysis
      analysis = {
        summary: "Document uploaded successfully. AI analysis is processing...",
        keyTopics: ["General Content", "Study Material", "Learning Resource"],
        difficultyLevel: "Intermediate",
        estimatedStudyTime: 15,
        aiInsights: "Please try uploading again for detailed AI analysis."
      };
    }

    // Validate and clean the analysis
    const cleanedAnalysis = {
      summary: analysis.summary || "Document analyzed successfully",
      keyTopics: Array.isArray(analysis.keyTopics) ? analysis.keyTopics : ["General Content"],
      difficultyLevel: ['Beginner', 'Intermediate', 'Advanced'].includes(analysis.difficultyLevel) 
        ? analysis.difficultyLevel 
        : 'Intermediate',
      estimatedStudyTime: typeof analysis.estimatedStudyTime === 'number' 
        ? Math.max(1, Math.min(120, analysis.estimatedStudyTime))
        : 15,
      aiInsights: analysis.aiInsights || "Study this material systematically for best results."
    };

    console.log('Cleaned analysis:', cleanedAnalysis);

    return new Response(
      JSON.stringify(cleanedAnalysis),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    );

  } catch (error) {
    console.error('Error in analyze-document function:', error);
    
    return new Response(
      JSON.stringify({ 
        error: 'Analysis failed', 
        details: error.message,
        fallback: {
          summary: "Document uploaded successfully. Please try again for AI analysis.",
          keyTopics: ["Document Content"],
          difficultyLevel: "Intermediate",
          estimatedStudyTime: 15,
          aiInsights: "Upload successful. AI analysis will be available shortly."
        }
      }),
      { 
        status: 500,
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    );
  }
});