
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Badge } from "@/shared/components/ui/badge";
import { Progress } from "@/shared/components/ui/progress";
import { Trophy, Clock, Target, TrendingUp, Star } from "lucide-react";

interface AssessmentResultsProps {
  results: {
    subject: string;
    readingSpeed: number;
    comprehensionScore: number;
    totalQuestions: number;
    correctAnswers: number;
    level: string;
  };
  onRetakeAssessment: () => void;
  onContinueToDashboard: () => void;
}

const AssessmentResults = ({ results, onRetakeAssessment, onContinueToDashboard }: AssessmentResultsProps) => {
  const getSpeedFeedback = (speed: number) => {
    if (speed >= 250) return { text: "Excellent! You're a speed reader!", color: "text-green-600" };
    if (speed >= 200) return { text: "Great reading speed!", color: "text-blue-600" };
    if (speed >= 150) return { text: "Good reading pace", color: "text-yellow-600" };
    return { text: "Room for improvement", color: "text-orange-600" };
  };

  const getComprehensionFeedback = (score: number) => {
    if (score >= 90) return { text: "Outstanding comprehension!", color: "text-green-600" };
    if (score >= 70) return { text: "Good understanding", color: "text-blue-600" };
    if (score >= 50) return { text: "Fair comprehension", color: "text-yellow-600" };
    return { text: "Needs improvement", color: "text-red-600" };
  };

  const speedFeedback = getSpeedFeedback(results.readingSpeed);
  const comprehensionFeedback = getComprehensionFeedback(results.comprehensionScore);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100 p-4">
      <div className="container mx-auto py-8 max-w-4xl">
        <Card className="mb-8">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className="bg-gradient-to-r from-purple-500 to-blue-500 p-4 rounded-full">
                <Trophy className="h-12 w-12 text-white" />
              </div>
            </div>
            <CardTitle className="text-3xl bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
              Assessment Complete!
            </CardTitle>
            <CardDescription className="text-lg">
              Here are your {results.subject} learning speed results
            </CardDescription>
          </CardHeader>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Reading Speed Card */}
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg text-blue-700">Reading Speed</CardTitle>
                <Clock className="h-6 w-6 text-blue-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="text-3xl font-bold text-blue-900">
                  {results.readingSpeed} <span className="text-lg">WPM</span>
                </div>
                <Badge variant="outline" className="border-blue-200 text-blue-700">
                  {results.level} Level
                </Badge>
                <p className={`text-sm font-medium ${speedFeedback.color}`}>
                  {speedFeedback.text}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Comprehension Score Card */}
          <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg text-green-700">Comprehension</CardTitle>
                <Target className="h-6 w-6 text-green-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="text-3xl font-bold text-green-900">
                  {Math.round(results.comprehensionScore)}%
                </div>
                <Progress 
                  value={results.comprehensionScore} 
                  className="h-2 bg-green-200" 
                />
                <p className="text-sm text-green-700">
                  {results.correctAnswers} out of {results.totalQuestions} correct
                </p>
                <p className={`text-sm font-medium ${comprehensionFeedback.color}`}>
                  {comprehensionFeedback.text}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Detailed Analysis */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <TrendingUp className="h-5 w-5" />
              <span>Personalized Learning Insights</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <Star className="h-8 w-8 mx-auto text-purple-600 mb-2" />
                <h3 className="font-semibold text-purple-700">Learning Style</h3>
                <p className="text-sm text-purple-600">
                  {results.readingSpeed > 200 ? "Fast Visual Learner" : "Detailed Analytical Learner"}
                </p>
              </div>
              
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <Target className="h-8 w-8 mx-auto text-blue-600 mb-2" />
                <h3 className="font-semibold text-blue-700">Focus Areas</h3>
                <p className="text-sm text-blue-600">
                  {results.comprehensionScore < 70 ? "Comprehension strategies" : "Speed optimization"}
                </p>
              </div>
              
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <TrendingUp className="h-8 w-8 mx-auto text-green-600 mb-2" />
                <h3 className="font-semibold text-green-700">Recommendation</h3>
                <p className="text-sm text-green-600">
                  {results.level === "Advanced" ? "Challenge mode materials" : "Gradual speed building"}
                </p>
              </div>
            </div>
            
            <div className="bg-gradient-to-r from-purple-500 to-blue-600 text-white p-6 rounded-lg">
              <h3 className="text-lg font-semibold mb-2">🎯 Your Personalized Study Plan</h3>
              <p className="text-purple-100">
                Based on your assessment, we'll create customized study materials that match your 
                {results.readingSpeed > 200 ? " fast-paced" : " methodical"} learning style and focus on 
                {results.comprehensionScore < 70 ? " improving comprehension" : " maintaining excellence"}. 
                Your {results.subject} materials will be optimized for your {results.level.toLowerCase()} level.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4">
          <Button 
            onClick={onRetakeAssessment}
            variant="outline"
            className="flex-1"
          >
            Retake Assessment
          </Button>
          <Button 
            onClick={onContinueToDashboard}
            className="flex-1 bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600"
          >
            Continue to Dashboard
          </Button>
        </div>
      </div>
    </div>
  );
};

export default AssessmentResults;
