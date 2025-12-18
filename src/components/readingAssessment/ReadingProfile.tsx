import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  User, 
  TrendingUp, 
  Target, 
  Zap, 
  Eye, 
  Shield, 
  Calendar,
  Award,
  ArrowRight,
  BookOpen,
  AlertCircle
} from "lucide-react";
import { getUserProfile, type UserReadingProfile } from "@/lib/reading-api";
import { useToast } from "@/hooks/use-toast";

interface ReadingProfileProps {
  onStartAssessment: () => void;
}

export const ReadingProfile = ({ onStartAssessment }: ReadingProfileProps) => {
  const [profile, setProfile] = useState<UserReadingProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isNewUser, setIsNewUser] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      setLoading(true);
      const data = await getUserProfile();
      setProfile(data);
      setIsNewUser(false);
    } catch (error: any) {
      console.error('Error loading profile:', error);
      
      // Check if it's a 404 (new user)
      if (error.message?.includes('404') || error.message?.includes('No reading profile found')) {
        setIsNewUser(true);
      } else {
        toast({
          title: "Failed to load profile",
          description: error.message || "Please try again later",
          variant: "destructive"
        });
      }
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-96 mt-2" />
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <Skeleton key={i} className="h-32" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isNewUser) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
      <Card className="bg-gradient-to-br from-purple-50 to-blue-50 border-purple-200">
        <CardHeader className="text-center pb-4">
          <div className="flex justify-center mb-4">
            <div className="bg-gradient-to-r from-purple-500 to-blue-500 p-6 rounded-full">
              <BookOpen className="h-12 w-12 text-white" />
            </div>
          </div>
          <CardTitle className="text-3xl bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
            Welcome to Reading Assessment!
          </CardTitle>
          <CardDescription className="text-lg mt-2">
            Start your journey to becoming a better reader
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <Alert className="bg-blue-50 border-blue-200">
            <AlertCircle className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-blue-900">
              You haven't completed any assessments yet. Take your first assessment to create your reading profile and track your progress!
            </AlertDescription>
          </Alert>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-6 bg-white rounded-lg shadow-sm">
              <div className="bg-purple-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
                <Zap className="h-6 w-6 text-purple-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Track Speed</h3>
              <p className="text-sm text-gray-600">
                Measure your reading speed in words per minute
              </p>
            </div>

            <div className="text-center p-6 bg-white rounded-lg shadow-sm">
              <div className="bg-blue-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
                <Target className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Test Comprehension</h3>
              <p className="text-sm text-gray-600">
                Evaluate how well you understand what you read
              </p>
            </div>

            <div className="text-center p-6 bg-white rounded-lg shadow-sm">
              <div className="bg-green-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
                <TrendingUp className="h-6 w-6 text-green-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Monitor Progress</h3>
              <p className="text-sm text-gray-600">
                Watch your skills improve over time with detailed analytics
              </p>
            </div>
          </div>

          <div className="bg-gradient-to-r from-purple-500 to-blue-500 p-6 rounded-lg text-white">
            <h3 className="text-xl font-semibold mb-2">🎯 What You'll Get</h3>
            <ul className="space-y-2 text-purple-50">
              <li className="flex items-start gap-2">
                <span className="text-white mt-0.5">✓</span>
                <span>Personalized reading speed metrics (WPM)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-white mt-0.5">✓</span>
                <span>Comprehension and retention scores</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-white mt-0.5">✓</span>
                <span>Focus and integrity tracking</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-white mt-0.5">✓</span>
                <span>Historical progress charts and insights</span>
              </li>
            </ul>
          </div>

          <Button 
            onClick={onStartAssessment}
            size="lg"
            className="w-full bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-lg py-6"
          >
            Take Your First Assessment
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </CardContent>
      </Card>
      </motion.div>
    );
  }

  if (!profile) return null;

  const getScoreColor = (score: number, max: number = 100) => {
    const percentage = (score / max) * 100;
    if (percentage >= 80) return "text-green-600";
    if (percentage >= 60) return "text-blue-600";
    if (percentage >= 40) return "text-yellow-600";
    return "text-orange-600";
  };

  const getSpeedLevel = (wpm: number) => {
    if (wpm >= 300) return { level: "Expert", color: "bg-purple-500" };
    if (wpm >= 250) return { level: "Advanced", color: "bg-blue-500" };
    if (wpm >= 200) return { level: "Intermediate", color: "bg-green-500" };
    if (wpm >= 150) return { level: "Developing", color: "bg-yellow-500" };
    return { level: "Beginner", color: "bg-orange-500" };
  };

  const currentSpeedLevel = getSpeedLevel(profile.current.weightedWPM);
  const bestSpeedLevel = getSpeedLevel(profile.best.weightedWPM);

  return (
    <motion.div 
      className="space-y-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      {/* Header Card */}
      <Card className="bg-gradient-to-r from-purple-500 to-blue-500 text-white border-0">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="bg-white/20 p-4 rounded-full">
                <User className="h-8 w-8" />
              </div>
              <div>
                <CardTitle className="text-2xl text-white">Your Reading Profile</CardTitle>
                <CardDescription className="text-purple-100">
                  {profile.stats.totalAssessments} assessment{profile.stats.totalAssessments !== 1 ? 's' : ''} completed
                </CardDescription>
              </div>
            </div>
            <Button 
              onClick={onStartAssessment}
              variant="secondary"
              className="bg-white text-purple-600 hover:bg-purple-50"
            >
              New Assessment
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* Current Stats */}
      <div>
        <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
          <TrendingUp className="h-6 w-6 text-purple-600" />
          Current Performance
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Reading Speed */}
          <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg text-purple-700">Reading Speed</CardTitle>
                <Zap className="h-5 w-5 text-purple-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="text-3xl font-bold text-purple-900">
                  {Math.round(profile.current.weightedWPM)} <span className="text-lg">WPM</span>
                </div>
                <Badge className={`${currentSpeedLevel.color} text-white`}>
                  {currentSpeedLevel.level}
                </Badge>
                <Progress 
                  value={Math.min((profile.current.weightedWPM / 400) * 100, 100)} 
                  className="h-2 bg-purple-200"
                />
              </div>
            </CardContent>
          </Card>

          {/* Retention */}
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg text-blue-700">Retention</CardTitle>
                <Target className="h-5 w-5 text-blue-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className={`text-3xl font-bold ${getScoreColor(profile.current.retention)}`}>
                  {Math.round(profile.current.retention)}%
                </div>
                <Progress 
                  value={profile.current.retention} 
                  className="h-2 bg-blue-200"
                />
                <p className="text-sm text-blue-700">
                  Comprehension accuracy
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Speed Learning */}
          <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg text-green-700">Speed Learning</CardTitle>
                <Award className="h-5 w-5 text-green-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className={`text-3xl font-bold ${getScoreColor(profile.current.speedLearning)}`}>
                  {Math.round(profile.current.speedLearning)}
                </div>
                <Progress 
                  value={Math.min((profile.current.speedLearning / 100) * 100, 100)} 
                  className="h-2 bg-green-200"
                />
                <p className="text-sm text-green-700">
                  Speed × Comprehension
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Focus Ratio */}
          <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg text-yellow-700">Focus Ratio</CardTitle>
                <Eye className="h-5 w-5 text-yellow-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className={`text-3xl font-bold ${getScoreColor(profile.current.focusRatio * 100)}`}>
                  {Math.round(profile.current.focusRatio * 100)}%
                </div>
                <Progress 
                  value={profile.current.focusRatio * 100} 
                  className="h-2 bg-yellow-200"
                />
                <p className="text-sm text-yellow-700">
                  Attention during reading
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Integrity Score */}
          <Card className="bg-gradient-to-br from-indigo-50 to-indigo-100 border-indigo-200">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg text-indigo-700">Integrity</CardTitle>
                <Shield className="h-5 w-5 text-indigo-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className={`text-3xl font-bold ${getScoreColor(profile.current.integrityScore)}`}>
                  {Math.round(profile.current.integrityScore)}%
                </div>
                <Progress 
                  value={profile.current.integrityScore} 
                  className="h-2 bg-indigo-200"
                />
                <p className="text-sm text-indigo-700">
                  Assessment authenticity
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Last Assessment */}
          <Card className="bg-gradient-to-br from-gray-50 to-gray-100 border-gray-200">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg text-gray-700">Last Assessment</CardTitle>
                <Calendar className="h-5 w-5 text-gray-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="text-sm font-medium text-gray-900">
                  {profile.stats.lastAssessmentAt 
                    ? new Date(profile.stats.lastAssessmentAt).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                      })
                    : 'N/A'
                  }
                </div>
                <p className="text-xs text-gray-600">
                  {profile.stats.lastAssessmentAt 
                    ? new Date(profile.stats.lastAssessmentAt).toLocaleTimeString('en-US', {
                        hour: '2-digit',
                        minute: '2-digit'
                      })
                    : 'Complete an assessment'
                  }
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Best Performance */}
      <div>
        <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
          <Award className="h-6 w-6 text-yellow-600" />
          Personal Best
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="bg-gradient-to-br from-yellow-50 to-amber-100 border-yellow-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg text-yellow-700">Best Speed</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="text-3xl font-bold text-yellow-900">
                  {Math.round(profile.best.weightedWPM)} <span className="text-lg">WPM</span>
                </div>
                <Badge className={`${bestSpeedLevel.color} text-white`}>
                  {bestSpeedLevel.level}
                </Badge>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-yellow-50 to-amber-100 border-yellow-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg text-yellow-700">Best Retention</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-yellow-900">
                {Math.round(profile.best.retention)}%
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-yellow-50 to-amber-100 border-yellow-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg text-yellow-700">Best Speed Learning</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-yellow-900">
                {Math.round(profile.best.speedLearning)}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </motion.div>
  );
};
