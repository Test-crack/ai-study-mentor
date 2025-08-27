import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { content, title, contentType } = await req.json();
    
    console.log('Generating study guide for:', title, 'Type:', contentType);

    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openAIApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    // Create AI prompt for study guide generation
    const studyGuidePrompt = `
      Create a comprehensive study guide from the following ${contentType}:

      Title: ${title}
      Content: ${content}

      Please respond with a JSON object in this exact format:
      {
        "title": "Study Guide Title",
        "subject": "Subject Area",
        "difficulty": "Beginner|Intermediate|Advanced",
        "estimatedTime": "Estimated study time in format like '2h 30m'",
        "learningObjectives": ["objective1", "objective2", "objective3"],
        "topics": [
          {
            "name": "Topic Name",
            "summary": "Brief topic summary",
            "keyPoints": ["point1", "point2", "point3"],
            "practiceQuestions": ["question1", "question2"]
          }
        ],
        "studyPlan": {
          "week1": "Week 1 focus areas",
          "week2": "Week 2 focus areas", 
          "week3": "Week 3 focus areas"
        },
        "resources": ["additional resource 1", "additional resource 2"],
        "aiInsights": "Personalized learning recommendations and study tips"
      }

      Make the study guide comprehensive, well-structured, and optimized for effective learning.
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
            content: 'You are an expert educational content creator that generates comprehensive study guides. Always respond with valid JSON that matches the requested format exactly.'
          },
          {
            role: 'user',
            content: studyGuidePrompt
          }
        ],
        temperature: 0.7,
        max_tokens: 2000,
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('OpenAI API error:', errorData);
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const aiResponse = await response.json();
    const studyGuideText = aiResponse.choices[0].message.content;
    
    console.log('Raw AI response:', studyGuideText);

    // Parse the AI response
    let studyGuide;
    try {
      // Try to extract JSON from the response
      const jsonMatch = studyGuideText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        studyGuide = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON found in response');
      }
    } catch (parseError) {
      console.error('Error parsing AI response:', parseError);
      // Fallback study guide
      studyGuide = {
        title: `Study Guide: ${title}`,
        subject: "General Studies",
        difficulty: "Intermediate",
        estimatedTime: "2h 0m",
        learningObjectives: [
          "Understand key concepts from the material",
          "Apply knowledge in practical scenarios",
          "Prepare for assessments and evaluations"
        ],
        topics: [
          {
            name: "Core Concepts",
            summary: "Foundation knowledge from the uploaded material",
            keyPoints: ["Key concept 1", "Key concept 2", "Key concept 3"],
            practiceQuestions: ["Review question 1", "Review question 2"]
          }
        ],
        studyPlan: {
          week1: "Review and understand core concepts",
          week2: "Practice application of knowledge", 
          week3: "Consolidation and assessment preparation"
        },
        resources: ["Original material", "Additional practice exercises"],
        aiInsights: "This study guide has been created from your uploaded content. Focus on understanding the key concepts before moving to application."
      };
    }

    // Validate and clean the study guide
    const cleanedStudyGuide = {
      title: studyGuide.title || `Study Guide: ${title}`,
      subject: studyGuide.subject || "General Studies",
      difficulty: ['Beginner', 'Intermediate', 'Advanced'].includes(studyGuide.difficulty) 
        ? studyGuide.difficulty 
        : 'Intermediate',
      estimatedTime: studyGuide.estimatedTime || "2h 0m",
      learningObjectives: Array.isArray(studyGuide.learningObjectives) 
        ? studyGuide.learningObjectives 
        : ["Master the key concepts", "Apply knowledge effectively"],
      topics: Array.isArray(studyGuide.topics) ? studyGuide.topics : [],
      studyPlan: studyGuide.studyPlan || {
        week1: "Initial learning phase",
        week2: "Practice and application",
        week3: "Review and mastery"
      },
      resources: Array.isArray(studyGuide.resources) ? studyGuide.resources : [],
      aiInsights: studyGuide.aiInsights || "Focus on consistent practice and regular review for best results."
    };

    console.log('Cleaned study guide:', cleanedStudyGuide);

    return new Response(
      JSON.stringify(cleanedStudyGuide),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    );

  } catch (error) {
    console.error('Error in generate-study-guide function:', error);
    
    return new Response(
      JSON.stringify({ 
        error: 'Study guide generation failed', 
        details: error.message,
        fallback: {
          title: "Study Guide Generation Error",
          subject: "General",
          difficulty: "Intermediate",
          estimatedTime: "1h 0m",
          learningObjectives: ["Review the material", "Try again later"],
          topics: [],
          studyPlan: {
            week1: "Technical issue encountered",
            week2: "Please try regenerating", 
            week3: "Contact support if problem persists"
          },
          resources: [],
          aiInsights: "There was an error generating your study guide. Please try again or contact support."
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