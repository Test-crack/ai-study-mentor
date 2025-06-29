
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Book, Video, Star, Plus, BookOpen, Youtube } from "lucide-react";
import { NotesUpload } from "@/components/NotesUpload";
import { YouTubeAnalyzer } from "@/components/YouTubeAnalyzer";
import { StudyGuides } from "@/components/StudyGuides";
import { PremiumModal } from "@/components/PremiumModal";
import { ProgressDashboard } from "@/components/ProgressDashboard";

const Index = () => {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [showPremiumModal, setShowPremiumModal] = useState(false);

  // Mock user data - in real app this would come from auth/database
  const user = {
    name: "Alex",
    streak: 12,
    totalStudyTime: 45,
    completedSessions: 8,
    isPremium: false
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
            <div className="text-center space-y-4">
              <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                Welcome back, {user.name}! 🎓
              </h1>
              <p className="text-xl text-muted-foreground">
                Your AI-powered learning companion is ready to help you excel
              </p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-purple-700">Study Streak</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-purple-900">{user.streak} days</div>
                </CardContent>
              </Card>
              
              <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-blue-700">Study Time</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-blue-900">{user.totalStudyTime}h</div>
                </CardContent>
              </Card>
              
              <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-green-700">Sessions</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-900">{user.completedSessions}</div>
                </CardContent>
              </Card>
              
              <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-orange-700">Progress</CardTitle>
                </CardHeader>
                <CardContent>
                  <Progress value={75} className="mt-2" />
                  <div className="text-sm text-orange-700 mt-1">75% to next level</div>
                </CardContent>
              </Card>
            </div>

            {/* Feature Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {features.map((feature, index) => (
                <Card 
                  key={index} 
                  className="cursor-pointer hover:shadow-lg transition-all duration-300 hover:scale-105 relative overflow-hidden"
                  onClick={feature.action}
                >
                  {feature.premium && !user.isPremium && (
                    <Badge className="absolute top-3 right-3 bg-gradient-to-r from-purple-500 to-pink-500">
                      Premium
                    </Badge>
                  )}
                  <CardHeader>
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-gradient-to-br from-purple-100 to-blue-100 rounded-lg">
                        <feature.icon className="h-6 w-6 text-purple-600" />
                      </div>
                      <div className="flex-1">
                        <CardTitle className="text-lg">{feature.title}</CardTitle>
                        <CardDescription>{feature.description}</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                </Card>
              ))}
            </div>

            {/* Quick Actions */}
            <Card className="bg-gradient-to-r from-purple-500 to-blue-600 text-white">
              <CardHeader>
                <CardTitle className="text-white">Ready to learn something new?</CardTitle>
                <CardDescription className="text-purple-100">
                  Start with uploading your notes or analyzing a YouTube video
                </CardDescription>
              </CardHeader>
              <CardContent className="flex space-x-4">
                <Button 
                  variant="secondary" 
                  onClick={() => setActiveTab("notes")}
                  className="bg-white text-purple-600 hover:bg-purple-50"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Upload Notes
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setActiveTab("youtube")}
                  className="border-white text-white hover:bg-white hover:text-purple-600"
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
      <nav className="bg-white/80 backdrop-blur-sm border-b sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-8">
              <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                StudyAI
              </h1>
              <div className="hidden md:flex space-x-6">
                <Button 
                  variant={activeTab === "dashboard" ? "default" : "ghost"}
                  onClick={() => setActiveTab("dashboard")}
                >
                  Dashboard
                </Button>
                <Button 
                  variant={activeTab === "notes" ? "default" : "ghost"}
                  onClick={() => setActiveTab("notes")}
                >
                  Notes
                </Button>
                <Button 
                  variant={activeTab === "youtube" ? "default" : "ghost"}
                  onClick={() => setActiveTab("youtube")}
                >
                  Videos
                </Button>
                <Button 
                  variant={activeTab === "guides" ? "default" : "ghost"}
                  onClick={() => setActiveTab("guides")}
                >
                  Study Guides
                </Button>
                <Button 
                  variant={activeTab === "progress" ? "default" : "ghost"}
                  onClick={() => setActiveTab("progress")}
                >
                  Progress
                </Button>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              {!user.isPremium && (
                <Button 
                  onClick={() => setShowPremiumModal(true)}
                  className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                >
                  <Star className="h-4 w-4 mr-2" />
                  Upgrade
                </Button>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
