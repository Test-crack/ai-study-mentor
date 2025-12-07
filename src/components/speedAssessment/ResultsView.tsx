import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { 
  Clock, BookOpen, Target, Award, Lightbulb, CheckCircle, Eye, 
  Shield, ShieldAlert, AlertTriangle, TrendingUp, TrendingDown 
} from "lucide-react";
import { AssessmentResult, PassageData } from "@/lib/reading-api";

interface ResultsViewProps {
  assessmentResults: AssessmentResult;
  currentPassage: PassageData;
  totalReadingTime: number;
  formatTime: (seconds: number) => string;
  onTakeAnother: () => void;
  onBackToDashboard: () => void;
}

export const ResultsView = ({
  assessmentResults,
  currentPassage,
  totalReadingTime,
  formatTime,
  onTakeAnother,
  onBackToDashboard
}: ResultsViewProps) => {
  const getPerformanceLevel = (score: number) => {
    if (score >= 80) return { label: "Excellent", color: "text-green-600", bgColor: "bg-green-100" };
    if (score >= 60) return { label: "Good", color: "text-blue-600", bgColor: "bg-blue-100" };
    if (score >= 40) return { label: "Average", color: "text-yellow-600", bgColor: "bg-yellow-100" };
    return { label: "Needs Improvement", color: "text-red-600", bgColor: "bg-red-100" };
  };
  
  const overallLevel = getPerformanceLevel(assessmentResults.metrics.speedLearningScore);
  
  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <Card className="bg-gradient-to-r from-green-500 via-blue-500 to-purple-600 text-white overflow-hidden relative">
        <div className="absolute inset-0 bg-gradient-to-r from-green-500/90 via-blue-500/90 to-purple-600/90"></div>
        <CardContent className="relative z-10 p-8 text-center">
          <div className="space-y-4">
            <div className="text-6xl animate-bounce">🎉</div>
            <CardTitle className="text-4xl font-bold">
              Assessment Complete!
            </CardTitle>
            <div className="text-lg opacity-90">
              {currentPassage.title} • {currentPassage.difficulty} level
            </div>
            <div className={`inline-flex items-center px-6 py-2 rounded-full text-lg font-semibold ${overallLevel.bgColor} ${overallLevel.color} bg-opacity-20 backdrop-blur-sm`}>
              Overall Performance: {overallLevel.label}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Integrity Status */}
      {assessmentResults.integrityFlags && (
        <Card className={`border-2 ${
          assessmentResults.integrityFlags.integrityScore >= 0.8 
            ? 'border-green-200 bg-green-50' 
            : assessmentResults.integrityFlags.integrityScore >= 0.6 
            ? 'border-yellow-200 bg-yellow-50' 
            : 'border-red-200 bg-red-50'
        }`}>
          <CardHeader>
            <CardTitle className={`flex items-center ${
              assessmentResults.integrityFlags.integrityScore >= 0.8 
                ? 'text-green-800' 
                : assessmentResults.integrityFlags.integrityScore >= 0.6 
                ? 'text-yellow-800' 
                : 'text-red-800'
            }`}>
              <div className={`p-2 rounded-lg mr-3 ${
                assessmentResults.integrityFlags.integrityScore >= 0.8 
                  ? 'bg-green-500' 
                  : assessmentResults.integrityFlags.integrityScore >= 0.6 
                  ? 'bg-yellow-500' 
                  : 'bg-red-500'
              }`}>
                {assessmentResults.integrityFlags.integrityScore >= 0.8 ? (
                  <Shield className="w-5 h-5 text-white" />
                ) : (
                  <ShieldAlert className="w-5 h-5 text-white" />
                )}
              </div>
              Assessment Integrity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Integrity Score</span>
                <div className={`px-3 py-1 rounded-full text-sm font-bold ${
                  assessmentResults.integrityFlags.integrityScore >= 0.8 
                    ? 'bg-green-100 text-green-800' 
                    : assessmentResults.integrityFlags.integrityScore >= 0.6 
                    ? 'bg-yellow-100 text-yellow-800' 
                    : 'bg-red-100 text-red-800'
                }`}>
                  {Math.round(assessmentResults.integrityFlags.integrityScore * 100)}%
                </div>
              </div>
              
              <div className="space-y-2">
                {assessmentResults.integrityFlags.lowFocusRatio && (
                  <div className="flex items-center space-x-2 text-red-700">
                    <AlertTriangle className="w-4 h-4" />
                    <span className="text-sm">Low focus ratio detected</span>
                  </div>
                )}
                {assessmentResults.integrityFlags.excessiveTabSwitches && (
                  <div className="flex items-center space-x-2 text-red-700">
                    <AlertTriangle className="w-4 h-4" />
                    <span className="text-sm">Excessive tab switching detected</span>
                  </div>
                )}
                {assessmentResults.integrityFlags.suspiciousBehavior && (
                  <div className="flex items-center space-x-2 text-red-700">
                    <AlertTriangle className="w-4 h-4" />
                    <span className="text-sm">Suspicious behavior patterns detected</span>
                  </div>
                )}
              </div>
              
              <div className="bg-white p-4 rounded-lg border">
                <p className="text-sm text-gray-700">{assessmentResults.integrityFeedback}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Performance Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-2 border-blue-200 hover:shadow-xl transition-shadow relative overflow-hidden">
          <div className="absolute top-0 right-0 w-16 h-16 bg-blue-200 rounded-bl-full opacity-50"></div>
          <CardContent className="p-6 relative z-10">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 bg-blue-500 rounded-lg">
                <Clock className="w-6 h-6 text-white" />
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold text-blue-900 animate-pulse">{assessmentResults.metrics.weightedWPM}</div>
                <div className="text-sm font-medium text-blue-700">WPM</div>
                {assessmentResults.baseMetrics && assessmentResults.baseMetrics.weightedWPM !== assessmentResults.metrics.weightedWPM && (
                  <div className="flex items-center space-x-1 mt-1">
                    {assessmentResults.metrics.weightedWPM > assessmentResults.baseMetrics.weightedWPM ? (
                      <TrendingUp className="w-3 h-3 text-green-600" />
                    ) : (
                      <TrendingDown className="w-3 h-3 text-red-600" />
                    )}
                    <span className="text-xs text-gray-600">
                      {assessmentResults.baseMetrics.weightedWPM} → {assessmentResults.metrics.weightedWPM}
                    </span>
                  </div>
                )}
              </div>
            </div>
            <div className="text-sm text-blue-600">Reading Speed</div>
            <Progress value={Math.min((assessmentResults.metrics.weightedWPM / 300) * 100, 100)} className="mt-2 h-2" />
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-2 border-green-200 hover:shadow-xl transition-shadow relative overflow-hidden">
          <div className="absolute top-0 right-0 w-16 h-16 bg-green-200 rounded-bl-full opacity-50"></div>
          <CardContent className="p-6 relative z-10">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 bg-green-500 rounded-lg">
                <Target className="w-6 h-6 text-white" />
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold text-green-900 animate-pulse">{assessmentResults.metrics.accuracy}</div>
                <div className="text-sm font-medium text-green-700">%</div>
                {assessmentResults.baseMetrics && assessmentResults.baseMetrics.accuracy !== assessmentResults.metrics.accuracy && (
                  <div className="flex items-center space-x-1 mt-1">
                    {assessmentResults.metrics.accuracy > assessmentResults.baseMetrics.accuracy ? (
                      <TrendingUp className="w-3 h-3 text-green-600" />
                    ) : (
                      <TrendingDown className="w-3 h-3 text-red-600" />
                    )}
                    <span className="text-xs text-gray-600">
                      {assessmentResults.baseMetrics.accuracy} → {assessmentResults.metrics.accuracy}
                    </span>
                  </div>
                )}
              </div>
            </div>
            <div className="text-sm text-green-600">Accuracy</div>
            <Progress value={assessmentResults.metrics.accuracy} className="mt-2 h-2" />
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-2 border-purple-200 hover:shadow-xl transition-shadow relative overflow-hidden">
          <div className="absolute top-0 right-0 w-16 h-16 bg-purple-200 rounded-bl-full opacity-50"></div>
          <CardContent className="p-6 relative z-10">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 bg-purple-500 rounded-lg">
                <BookOpen className="w-6 h-6 text-white" />
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold text-purple-900 animate-pulse">{assessmentResults.metrics.retention}</div>
                <div className="text-sm font-medium text-purple-700">%</div>
                {assessmentResults.baseMetrics && assessmentResults.baseMetrics.retention !== assessmentResults.metrics.retention && (
                  <div className="flex items-center space-x-1 mt-1">
                    {assessmentResults.metrics.retention > assessmentResults.baseMetrics.retention ? (
                      <TrendingUp className="w-3 h-3 text-green-600" />
                    ) : (
                      <TrendingDown className="w-3 h-3 text-red-600" />
                    )}
                    <span className="text-xs text-gray-600">
                      {assessmentResults.baseMetrics.retention} → {assessmentResults.metrics.retention}
                    </span>
                  </div>
                )}
              </div>
            </div>
            <div className="text-sm text-purple-600">Retention</div>
            <Progress value={assessmentResults.metrics.retention} className="mt-2 h-2" />
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-2 border-orange-200 hover:shadow-xl transition-shadow relative overflow-hidden">
          <div className="absolute top-0 right-0 w-16 h-16 bg-orange-200 rounded-bl-full opacity-50"></div>
          <CardContent className="p-6 relative z-10">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 bg-orange-500 rounded-lg">
                <Award className="w-6 h-6 text-white" />
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold text-orange-900 animate-pulse">{assessmentResults.metrics.speedLearningScore}</div>
                <div className="text-sm font-medium text-orange-700">Score</div>
                {assessmentResults.baseMetrics && assessmentResults.baseMetrics.speedLearningScore !== assessmentResults.metrics.speedLearningScore && (
                  <div className="flex items-center space-x-1 mt-1">
                    {assessmentResults.metrics.speedLearningScore > assessmentResults.baseMetrics.speedLearningScore ? (
                      <TrendingUp className="w-3 h-3 text-green-600" />
                    ) : (
                      <TrendingDown className="w-3 h-3 text-red-600" />
                    )}
                    <span className="text-xs text-gray-600">
                      {assessmentResults.baseMetrics.speedLearningScore} → {assessmentResults.metrics.speedLearningScore}
                    </span>
                  </div>
                )}
              </div>
            </div>
            <div className="text-sm text-orange-600">Overall Score</div>
            <Progress value={assessmentResults.metrics.speedLearningScore} className="mt-2 h-2" />
          </CardContent>
        </Card>
      </div>

      {/* Feedback Section */}
      <Card className="bg-gradient-to-r from-indigo-50 to-blue-50 border-indigo-200">
        <CardHeader>
          <CardTitle className="flex items-center text-indigo-900">
            <div className="p-2 bg-indigo-500 rounded-lg mr-3">
              <Lightbulb className="w-5 h-5 text-white" />
            </div>
            Personalized Feedback
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-lg text-indigo-800 leading-relaxed">{assessmentResults.feedback}</p>
        </CardContent>
      </Card>
      
      {/* Focus Data Section */}
      {assessmentResults.focusData && (
        <Card className="bg-gradient-to-r from-cyan-50 to-blue-50 border-cyan-200">
          <CardHeader>
            <CardTitle className="flex items-center text-cyan-800">
              <div className="p-2 bg-cyan-500 rounded-lg mr-3">
                <Eye className="w-5 h-5 text-white" />
              </div>
              Focus & Engagement Data
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 text-center">
              <div className="bg-white p-4 rounded-lg border border-cyan-200">
                <div className="text-3xl font-bold text-cyan-900 mb-1">
                  {Math.round(assessmentResults.focusData.focusRatio * 100)}%
                </div>
                <div className="text-sm font-medium text-cyan-700">Focus Ratio</div>
                <div className="text-xs text-cyan-600 mt-1">Time focused vs total</div>
              </div>
              <div className="bg-white p-4 rounded-lg border border-cyan-200">
                <div className="text-3xl font-bold text-cyan-900 mb-1">
                  {assessmentResults.focusData.tabSwitches}
                </div>
                <div className="text-sm font-medium text-cyan-700">Tab Switches</div>
                <div className="text-xs text-cyan-600 mt-1">Times switched away</div>
              </div>
              <div className="bg-white p-4 rounded-lg border border-cyan-200">
                <div className="text-3xl font-bold text-cyan-900 mb-1">
                  {formatTime(Math.round(assessmentResults.focusData.focusTime / 1000))}
                </div>
                <div className="text-sm font-medium text-cyan-700">Focus Time</div>
                <div className="text-xs text-cyan-600 mt-1">Actual focused time</div>
              </div>
              <div className="bg-white p-4 rounded-lg border border-cyan-200">
                <div className="text-3xl font-bold text-cyan-900 mb-1">
                  {formatTime(Math.round(assessmentResults.focusData.totalSessionTime / 1000))}
                </div>
                <div className="text-sm font-medium text-cyan-700">Total Session</div>
                <div className="text-xs text-cyan-600 mt-1">Total time tracked</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Reading Statistics */}
      <Card className="bg-white shadow-lg">
        <CardHeader>
          <CardTitle className="text-center text-gray-800">Reading Statistics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 text-center">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-lg">
              <div className="text-3xl font-bold text-blue-900 mb-1">{formatTime(totalReadingTime)}</div>
              <div className="text-sm font-medium text-blue-700">Reading Time</div>
              <div className="text-xs text-blue-600 mt-1">Actual time spent</div>
            </div>
            <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-lg">
              <div className="text-3xl font-bold text-green-900 mb-1">{currentPassage.wordCount}</div>
              <div className="text-sm font-medium text-green-700">Words Read</div>
              <div className="text-xs text-green-600 mt-1">Total passage length</div>
            </div>
            <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-lg">
              <div className="text-3xl font-bold text-purple-900 mb-1">
                {assessmentResults.answerReview.filter(a => a.isCorrect).length}/{assessmentResults.answerReview.length}
              </div>
              <div className="text-sm font-medium text-purple-700">Questions Correct</div>
              <div className="text-xs text-purple-600 mt-1">Comprehension score</div>
            </div>
            <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-4 rounded-lg">
              <div className="text-3xl font-bold text-orange-900 mb-1">{currentPassage.idealWPM}</div>
              <div className="text-sm font-medium text-orange-700">Target WPM</div>
              <div className="text-xs text-orange-600 mt-1">Recommended speed</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Answer Review */}
      <Card className="bg-white shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center text-gray-800">
            <div className="p-2 bg-gray-600 rounded-lg mr-3">
              <CheckCircle className="w-5 h-5 text-white" />
            </div>
            Detailed Answer Review
          </CardTitle>
          <CardDescription>
            Review your answers and learn from any mistakes
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {assessmentResults.answerReview.map((review, index) => {
            const question = currentPassage.questions.find(q => q.id === review.questionId);
            return (
              <Card key={review.questionId} className={`overflow-hidden ${
                review.isCorrect 
                  ? 'bg-gradient-to-r from-green-50 to-emerald-50 border-l-4 border-l-green-500' 
                  : 'bg-gradient-to-r from-red-50 to-pink-50 border-l-4 border-l-red-500'
              }`}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <h4 className="text-lg font-semibold text-gray-800">Question {index + 1}</h4>
                    <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                      review.isCorrect 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {review.isCorrect ? (
                        <>
                          <div className="w-4 h-4 rounded-full bg-green-500 flex items-center justify-center mr-2">
                            <span className="text-white text-xs font-bold">✓</span>
                          </div>
                          Correct
                        </>
                      ) : (
                        <>
                          <div className="w-4 h-4 rounded-full bg-red-500 flex items-center justify-center mr-2">
                            <span className="text-white text-xs font-bold">✗</span>
                          </div>
                          Incorrect
                        </>
                      )}
                    </div>
                  </div>
                  
                  {question && (
                    <div className="mb-4 p-3 bg-white rounded-lg border">
                      <p className="text-gray-700 font-medium">{question.stem}</p>
                    </div>
                  )}
                  
                  <div className="space-y-3">
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0 w-20 text-sm font-medium text-gray-600">Your answer:</div>
                      <div className={`flex-1 p-3 rounded-lg ${
                        review.isCorrect ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {review.selectedOption}
                      </div>
                    </div>
                    
                    {!review.isCorrect && (
                      <div className="flex items-start space-x-3">
                        <div className="flex-shrink-0 w-20 text-sm font-medium text-gray-600">Correct answer:</div>
                        <div className="flex-1 p-3 rounded-lg bg-green-100 text-green-800 border border-green-200">
                          {review.correctAnswer}
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <Card className="bg-gradient-to-r from-blue-500 to-purple-600 text-white">
        <CardContent className="p-8 text-center">
          <h3 className="text-xl font-semibold mb-4">Ready for another challenge?</h3>
          <div className="flex flex-col sm:flex-row justify-center items-center space-y-3 sm:space-y-0 sm:space-x-4">
            <Button 
              onClick={onTakeAnother}
              size="lg"
              className="bg-white text-blue-600 hover:bg-blue-50 shadow-lg transform hover:scale-105 transition-all"
            >
              <BookOpen className="w-5 h-5 mr-2" />
              Take Another Assessment
            </Button>
            
            <Button 
              onClick={onBackToDashboard}
              size="lg"
              variant="outline"
              className="border-2 border-white text-white hover:bg-white hover:text-blue-600 shadow-lg transform hover:scale-105 transition-all"
            >
              Back to Dashboard
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
