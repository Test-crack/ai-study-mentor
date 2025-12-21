
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Book, Video, Star, Plus, BookOpen, Youtube, Clock } from "lucide-react";
import { NotesUpload } from "@/components/NotesUpload";
import { YouTubeAnalyzer } from "@/components/YouTubeAnalyzer";
import { StudyGuides } from "@/components/StudyGuides";
import { PremiumModal } from "@/components/PremiumModal";
import { ProgressDashboard } from "@/components/ProgressDashboard";
import { Navbar } from "@/components/Navbar";
import { useAuth } from "@/hooks/useAuth";

const Index = () => {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const { user } = useAuth();

  // Extract user name from email (first part before @)
  const userName = user?.email?.split('@')[0] || 'Student';

  // Mock user data for demo - in production this would come from database
  const userData = {
    name: userName,
    streak: 12,
    totalStudyTime: 45,
    completedSessions: 8,
    isPremium: false,
    lastAssessment: {
      readingSpeed: 185,
      level: "Intermediate"
    }
  };



  const features = [
    {
      icon: Book,
      title: "Smart Notes",
      description: "Upload and analyze your study materials with AI",
      action: () => setActiveTab("notes"),
      premium: false
    },
    {
      icon: Youtube,
      title: "YouTube Learning",
      description: "Extract and summarize video content instantly",
      action: () => setActiveTab("youtube"),
      premium: false
    },
    {
      icon: BookOpen,
      title: "Study Guides",
      description: "AI-generated personalized study guides",
      action: () => setActiveTab("guides"),
      premium: false
    },
    {
      icon: Clock,
      title: "Speed Assessment",
      description: "Test and improve your reading speed",
      action: () => window.location.href = "/assessment",
      premium: false
    },
    {
      icon: Star,
      title: "AI Tutor Sessions",
      description: "One-on-one AI tutoring with adaptive learning",
      action: () => setShowPremiumModal(true),
      premium: true
    }
  ];

  const renderContent = () => {
    switch (activeTab) {
      case "notes":
        return <NotesUpload />;
      case "youtube":
        return <YouTubeAnalyzer />;
      case "guides":
        return <StudyGuides />;
      case "progress":
        return <ProgressDashboard />;
      default:
        return (
          <div className="space-y-8">
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
                  <CardTitle className="text-xs sm:text-sm font-medium text-purple-700">Study Streak</CardTitle>
                </CardHeader>
                <CardContent className="p-3 sm:p-4 pt-0">
                  <div className="text-xl sm:text-2xl font-bold text-purple-900">{userData.streak} days</div>
                </CardContent>
              </Card>
              
              <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
                <CardHeader className="pb-2 p-3 sm:p-4">
                  <CardTitle className="text-xs sm:text-sm font-medium text-blue-700">Study Time</CardTitle>
                </CardHeader>
                <CardContent className="p-3 sm:p-4 pt-0">
                  <div className="text-xl sm:text-2xl font-bold text-blue-900">{userData.totalStudyTime}h</div>
                </CardContent>
              </Card>
              
              <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
                <CardHeader className="pb-2 p-3 sm:p-4">
                  <CardTitle className="text-xs sm:text-sm font-medium text-green-700">Sessions</CardTitle>
                </CardHeader>
                <CardContent className="p-3 sm:p-4 pt-0">
                  <div className="text-xl sm:text-2xl font-bold text-green-900">{userData.completedSessions}</div>
                </CardContent>
              </Card>
              
              <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200 col-span-2 sm:col-span-1">
                <CardHeader className="pb-2 p-3 sm:p-4">
                  <CardTitle className="text-xs sm:text-sm font-medium text-orange-700">Progress</CardTitle>
                </CardHeader>
                <CardContent className="p-3 sm:p-4 pt-0">
                  <Progress value={75} className="mt-2" />
                  <div className="text-xs sm:text-sm text-orange-700 mt-1">75% to next level</div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-indigo-50 to-indigo-100 border-indigo-200 col-span-2 sm:col-span-1">
                <CardHeader className="pb-2 p-3 sm:p-4">
                  <CardTitle className="text-xs sm:text-sm font-medium text-indigo-700">Reading Speed</CardTitle>
                </CardHeader>
                <CardContent className="p-3 sm:p-4 pt-0">
                  <div className="text-xl sm:text-2xl font-bold text-indigo-900">{userData.lastAssessment.readingSpeed} WPM</div>
                  <div className="text-xs sm:text-sm text-indigo-700">{userData.lastAssessment.level}</div>
                </CardContent>
              </Card>
            </div>

            {/* Feature Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {features.map((feature, index) => (
                <Card 
                  key={index} 
                  className="cursor-pointer hover:shadow-lg transition-all duration-300 hover:scale-105 active:scale-95 relative overflow-hidden"
                  onClick={feature.action}
                >
                  {feature.premium && !userData.isPremium && (
                    <Badge className="absolute top-3 right-3 bg-gradient-to-r from-purple-500 to-pink-500 text-xs">
                      Premium
                    </Badge>
                  )}
                  <CardHeader className="p-4 sm:p-6">
                    <div className="flex items-start sm:items-center space-x-3">
                      <div className="p-2 bg-gradient-to-br from-purple-100 to-blue-100 rounded-lg flex-shrink-0">
                        <feature.icon className="h-5 w-5 sm:h-6 sm:w-6 text-purple-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-base sm:text-lg">{feature.title}</CardTitle>
                        <CardDescription className="text-xs sm:text-sm">{feature.description}</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                </Card>
              ))}
            </div>

            {/* Quick Actions */}
            <Card className="bg-gradient-to-r from-purple-500 to-blue-600 text-white">
              <CardHeader className="p-4 sm:p-6">
                <CardTitle className="text-white text-lg sm:text-xl">Ready to learn something new?</CardTitle>
                <CardDescription className="text-purple-100 text-sm sm:text-base">
                  Start with uploading your notes or analyzing a YouTube video
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col sm:flex-row gap-3 sm:gap-4 p-4 sm:p-6 pt-0">
                <Button 
                  variant="secondary" 
                  onClick={() => setActiveTab("notes")}
                  className="bg-white text-purple-600 hover:bg-purple-50 w-full sm:w-auto"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Upload Notes
                </Button>
                <Button 
                  onClick={() => setActiveTab("youtube")}
                  className="border-2 border-white text-white hover:bg-white hover:text-purple-600 bg-transparent w-full sm:w-auto"
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
      {/* Navigation */}
      <Navbar
        showNavItems={true}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        showUpgradeButton={!userData.isPremium}
        onUpgradeClick={() => setShowPremiumModal(true)}
      />

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6 md:py-8">
        {renderContent()}
      </main>

      {/* Premium Modal */}
      <PremiumModal 
        isOpen={showPremiumModal} 
        onClose={() => setShowPremiumModal(false)} 
      />
    </div>
  );
};

export default Index;
