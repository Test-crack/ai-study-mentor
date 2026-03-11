import { useState, useEffect, useRef } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/shared/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/shared/components/ui/card';
import { Badge } from '@/shared/components/ui/badge';
import { Progress } from '@/shared/components/ui/progress';
import {
  Book,
  Star,
  Plus,
  BookOpen,
  Youtube,
  Clock,
  GraduationCap,
  ArrowRight,
} from 'lucide-react';
import { NotesUpload } from '@/features/notes/components/NotesUpload';
import { YouTubeAnalyzer } from '@/features/notes/components/YouTubeAnalyzer';
import { StudyGuides } from '@/features/notes/components/StudyGuides';
import { PremiumModal } from '@/features/payment/components/PremiumModal';
import { ProgressDashboard } from '@/features/profile/components/ProgressDashboard';
import { Navbar } from '@/shared/components/layout/Navbar';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { getBackendUrl } from '@/shared/utils';
import { callBackend } from '@/features/auth/services/authClient';

const DashboardPage = () => {
  const { tab } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const [displayName, setDisplayName] = useState<string>('');
  const { user } = useAuth();
  const hasLoadedProfile = useRef(false);

  useEffect(() => {
    if (location.state?.openUpgrade) {
      setShowPremiumModal(true);
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  useEffect(() => {
    if (hasLoadedProfile.current || !user) return;

    const loadProfile = async () => {
      try {
        const backendUrl = getBackendUrl();
        const data = await callBackend(`${backendUrl}/api/profile`, {
          method: 'GET',
        });

        if (data.user) {
          setDisplayName(data.user.name || data.user.email);
          hasLoadedProfile.current = true;
        }
      } catch (error) {
        console.error('Error loading profile:', error);
        setDisplayName(user?.email || 'Student');
      }
    };

    loadProfile();
  }, [user]);

  // Fallbacks ensure the UI never looks empty while waiting for the profile fetch
  const userData = {
    name: displayName || user?.email?.split('@')[0] || 'Student',
    streak: 12,
    totalStudyTime: 45,
    completedSessions: 8,
    isPremium: false,
    lastAssessment: {
      readingSpeed: 185,
      level: 'Intermediate',
    },
  };

  const features = [
    {
      icon: Book,
      title: 'Smart Notes',
      description: 'Upload and analyze your study materials with AI',
      action: () => navigate('/dashboard/notes'),
      premium: false,
    },
    {
      icon: Youtube,
      title: 'YouTube Learning',
      description: 'Extract and summarize video content instantly',
      action: () => navigate('/dashboard/youtube'),
      premium: false,
    },
    {
      icon: BookOpen,
      title: 'Study Guides',
      description: 'AI-generated personalized study guides',
      action: () => navigate('/dashboard/guides'),
      premium: false,
    },
    {
      icon: Clock,
      title: 'Speed Assessment',
      description: 'Test and improve your reading speed',
      action: () => navigate('/assessment'),
      premium: false,
    },
    {
      icon: Star,
      title: 'AI Tutor Sessions',
      description: 'One-on-one AI tutoring with adaptive learning',
      action: () => setShowPremiumModal(true),
      premium: true,
    },
    {
      icon: Star,
      title: 'Daily Streak',
      description: 'Assessment of daily Streak You Have',
      action: () => navigate('/404'), // Might want to update this route for a real demo!
      premium: false,
    },
  ];

  const renderContent = () => {
    switch (tab) {
      case 'notes':
        return <NotesUpload />;
      case 'youtube':
        return <YouTubeAnalyzer />;
      case 'guides':
        return <StudyGuides />;
      case 'progress':
        return <ProgressDashboard />;
      default:
        return (
          // Added Tailwind animate-in classes for a polished entrance
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 ease-out">
            {/* Welcome Section */}
            <div className="text-center space-y-3 px-2">
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                Welcome back, {userData.name}! 🎓
              </h1>
              <p className="text-base sm:text-lg md:text-xl text-muted-foreground">
                Your AI-powered learning companion is ready to help you excel
              </p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 sm:gap-4 md:gap-6">
              <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
                <CardHeader className="pb-2 p-3 sm:p-4">
                  <CardTitle className="text-xs sm:text-sm font-medium text-purple-700">
                    Study Streak
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-3 sm:p-4 pt-0">
                  <div className="text-xl sm:text-2xl font-bold text-purple-900">
                    {userData.streak} days
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
                <CardHeader className="pb-2 p-3 sm:p-4">
                  <CardTitle className="text-xs sm:text-sm font-medium text-blue-700">
                    Study Time
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-3 sm:p-4 pt-0">
                  <div className="text-xl sm:text-2xl font-bold text-blue-900">
                    {userData.totalStudyTime}h
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
                <CardHeader className="pb-2 p-3 sm:p-4">
                  <CardTitle className="text-xs sm:text-sm font-medium text-green-700">
                    Sessions
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-3 sm:p-4 pt-0">
                  <div className="text-xl sm:text-2xl font-bold text-green-900">
                    {userData.completedSessions}
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200 col-span-2 sm:col-span-1">
                <CardHeader className="pb-2 p-3 sm:p-4">
                  <CardTitle className="text-xs sm:text-sm font-medium text-orange-700">
                    Progress
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-3 sm:p-4 pt-0">
                  <Progress value={75} className="mt-2" />
                  <div className="text-xs sm:text-sm text-orange-700 mt-1">
                    75% to next level
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-indigo-50 to-indigo-100 border-indigo-200 col-span-2 sm:col-span-1">
                <CardHeader className="pb-2 p-3 sm:p-4">
                  <CardTitle className="text-xs sm:text-sm font-medium text-indigo-700">
                    Reading Speed
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-3 sm:p-4 pt-0">
                  <div className="text-xl sm:text-2xl font-bold text-indigo-900">
                    {userData.lastAssessment.readingSpeed} WPM
                  </div>
                  <div className="text-xs sm:text-sm text-indigo-700">
                    {userData.lastAssessment.level}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Courses CTA Banner */}
            <Card className="bg-indigo-700 border-none rounded-[24px] overflow-hidden relative group shadow-2xl">
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/20 to-purple-600/20 opacity-50 group-hover:opacity-70 transition-opacity" />
              <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48cGF0aCBkPSJNMzYgMzRjMC0yLjIxLTEuNzktNC00LTRzLTQgMS43OS00IDQgMS43OSA0IDQgNCA0LTEuNzkgNC00em0wLTEwYzAtMi4yMS0xLjc5LTQtNC00cy00IDEuNzktNCA0IDEuNzkgNCA0IDQgNC0xLjc5IDQtNHptMC0xMGMwLTIuMjEtMS43OS00LTQtNHMtNCAxLjc5LTQgNCAxLjc5IDQgNCA0IDQtMS43OSA0LTR6Ii8+PC9nPjwvZz48L3N2Zz4=')] opacity-10" />

              <CardContent className="p-8 md:p-12 relative flex flex-col md:flex-row items-center justify-between gap-8">
                <div className="space-y-4 text-center md:text-left">
                  <div className="flex flex-wrap justify-center md:justify-start gap-2 mb-2">
                    <Badge className="bg-indigo-500/20 text-indigo-200 border-indigo-500/30">
                      New Courses Available
                    </Badge>
                    <Badge className="bg-white/10 text-white border-white/20">
                      Beginner Friendly
                    </Badge>
                  </div>
                  <div className="flex items-center justify-center md:justify-start space-x-4">
                    <div className="hidden sm:block p-3 bg-white/10 backdrop-blur-md rounded-2xl border border-white/10">
                      <GraduationCap className="h-8 w-8 text-white" />
                    </div>
                    <h2 className="text-3xl md:text-4xl font-bold text-white tracking-tight">
                      Master New Skills Today
                    </h2>
                  </div>

                  <div className="space-y-2">
                    <p className="text-indigo-100 font-medium text-lg">
                      Structured learning paths designed by experts to take you from beginner to professional
                    </p>
                  </div>
                </div>

                <Button
                  onClick={() => navigate('/courses')}
                  className="bg-white text-indigo-900 hover:bg-slate-100 h-16 px-10 rounded-2xl font-bold text-lg transition-all shadow-xl hover:shadow-2xl active:scale-95 whitespace-nowrap"
                >
                  Browse Courses
                  <ArrowRight className="ml-2 h-6 w-6" />
                </Button>
              </CardContent>
            </Card>

            {/* Feature Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {features.map((feature, index) => (
                <Card
                  key={index}
                  className="cursor-pointer hover:shadow-lg transition-all duration-300 hover:scale-105 active:scale-95 relative overflow-hidden"
                  onClick={feature.action}
                >
                  {feature.premium && !userData.isPremium && (
                    <Badge className="absolute top-3 right-3 bg-indigo-700 text-xs">
                      Premium
                    </Badge>
                  )}
                  <CardHeader className="p-4 sm:p-6">
                    <div className="flex items-start sm:items-center space-x-3">
                      <div className="p-2 bg-gradient-to-br from-purple-100 to-blue-100 rounded-lg flex-shrink-0">
                        <feature.icon className="h-5 w-5 sm:h-6 sm:w-6 text-purple-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-base sm:text-lg">
                          {feature.title}
                        </CardTitle>
                        <CardDescription className="text-xs sm:text-sm">
                          {feature.description}
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                </Card>
              ))}
            </div>

            {/* Quick Actions */}
            <Card className="bg-indigo-700 text-white">
              <CardHeader className="p-4 sm:p-6">
                <CardTitle className="text-white text-lg sm:text-xl">
                  Ready to learn something new?
                </CardTitle>
                <CardDescription className="text-purple-100 text-sm sm:text-base">
                  Start with uploading your notes or analyzing a YouTube video
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col sm:flex-row gap-3 sm:gap-4 p-4 sm:p-6 pt-0">
                <Button
                  variant="secondary"
                  onClick={() => navigate('/dashboard/notes')}
                  className="border-2 border-white text-white hover:bg-white hover:text-purple-600 bg-transparent w-full sm:w-auto transition-all"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Upload Notes
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => navigate('/dashboard/youtube')}
                  className="border-2 border-white text-white hover:bg-white hover:text-purple-600 bg-transparent w-full sm:w-auto transition-all"
                >
                  <Youtube className="h-4 w-4 mr-2" />
                  Analyze Video
                </Button>
              </CardContent>
            </Card>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100">
      <Navbar
        showNavItems={true}
        showUpgradeButton={!userData.isPremium}
        onUpgradeClick={() => setShowPremiumModal(true)}
      />

      <main className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6 md:py-8">
        {renderContent()}
      </main>

      <PremiumModal
        isOpen={showPremiumModal}
        onClose={() => setShowPremiumModal(false)}
      />
    </div>
  );
};

export default DashboardPage;