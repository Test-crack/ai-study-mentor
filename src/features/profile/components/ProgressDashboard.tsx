
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Badge } from "@/shared/components/ui/badge";
import { Progress } from "@/shared/components/ui/progress";
import { Star, Book, Video, BookOpen, Check } from "lucide-react";
export const ProgressDashboard = () => {
  const weeklyStats = [
    { day: "Mon", studyTime: 45, sessions: 2 },
    { day: "Tue", studyTime: 60, sessions: 3 },
    { day: "Wed", studyTime: 30, sessions: 1 },
    { day: "Thu", studyTime: 90, sessions: 4 },
    { day: "Fri", studyTime: 75, sessions: 3 },
    { day: "Sat", studyTime: 120, sessions: 5 },
    { day: "Sun", studyTime: 40, sessions: 2 }
  ];

  const achievements = [
    { name: "Study Streak", description: "12 days in a row", icon: Star, color: "text-yellow-500" },
    { name: "Note Master", description: "Uploaded 25 documents", icon: Book, color: "text-blue-500" },
    { name: "Video Scholar", description: "Analyzed 10 videos", icon: Video, color: "text-red-500" },
    { name: "Guide Creator", description: "Completed 3 study guides", icon: BookOpen, color: "text-green-500" }
  ];

  const subjects = [
    { name: "Psychology", progress: 85, totalTime: "15h 30m", lastStudied: "Today" },
    { name: "Calculus", progress: 60, totalTime: "12h 45m", lastStudied: "Yesterday" },
    { name: "History", progress: 90, totalTime: "8h 20m", lastStudied: "2 days ago" },
    { name: "Physics", progress: 40, totalTime: "6h 15m", lastStudied: "1 week ago" }
  ];

  const maxStudyTime = Math.max(...weeklyStats.map(stat => stat.studyTime));

  return (
    <div className="space-y-6">
   
            
      <div className="text-center space-y-4">
        <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-brand-blue-600 bg-clip-text text-transparent">
          Learning Analytics
        </h2>
        <p className="text-muted-foreground">
          Track your progress and discover insights about your learning journey
        </p>
      </div>

      {/* Weekly Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">This Week</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">
              {weeklyStats.reduce((sum, day) => sum + day.studyTime, 0)} min
            </div>
            <p className="text-sm text-muted-foreground">Total study time</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Sessions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">
              {weeklyStats.reduce((sum, day) => sum + day.sessions, 0)}
            </div>
            <p className="text-sm text-muted-foreground">Learning sessions</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Average</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-brand-blue-600">
              {Math.round(weeklyStats.reduce((sum, day) => sum + day.studyTime, 0) / 7)} min
            </div>
            <p className="text-sm text-muted-foreground">Per day</p>
          </CardContent>
        </Card>
      </div>

      {/* Weekly Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Weekly Study Pattern</CardTitle>
          <CardDescription>Your daily study time and session count</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {weeklyStats.map((stat, index) => (
              <div key={index} className="flex items-center space-x-4">
                <div className="w-12 text-sm font-medium">{stat.day}</div>
                <div className="flex-1 space-y-1">
                  <div className="flex justify-between text-sm">
                    <span>{stat.studyTime} min</span>
                    <span>{stat.sessions} sessions</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-gradient-to-r from-blue-500 to-brand-blue-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${(stat.studyTime / maxStudyTime) * 100}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Subject Progress */}
      <Card>
        <CardHeader>
          <CardTitle>Subject Mastery</CardTitle>
          <CardDescription>Your progress across different subjects</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {subjects.map((subject, index) => (
              <div key={index} className="space-y-2">
                <div className="flex justify-between items-center">
                  <h4 className="font-medium">{subject.name}</h4>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-muted-foreground">{subject.totalTime}</span>
                    <Badge variant="outline" className="text-xs">
                      {subject.lastStudied}
                    </Badge>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Progress value={subject.progress} className="flex-1" />
                  <span className="text-sm font-medium w-12">{subject.progress}%</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Achievements */}
      <Card>
        <CardHeader>
          <CardTitle>Achievements</CardTitle>
          <CardDescription>Milestones you've unlocked on your learning journey</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {achievements.map((achievement, index) => (
              <div key={index} className="flex items-center space-x-3 p-3 bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg">
                <div className={`p-2 rounded-full bg-white ${achievement.color}`}>
                  <achievement.icon className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="font-medium">{achievement.name}</h4>
                  <p className="text-sm text-muted-foreground">{achievement.description}</p>
                </div>
                <Check className="h-5 w-5 text-green-500 ml-auto" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* AI Insights */}
      <Card className="bg-gradient-to-r from-brand-blue-50 to-blue-50 border-brand-blue-200">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Star className="h-5 w-5 text-brand-blue-600" />
            <span>AI Learning Insights</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="p-3 bg-white rounded-lg">
            <h4 className="font-medium text-brand-blue-800 mb-1">Peak Performance Time</h4>
            <p className="text-sm text-brand-blue-700">You study most effectively between 2-4 PM. Consider scheduling challenging topics during this time.</p>
          </div>
          <div className="p-3 bg-white rounded-lg">
            <h4 className="font-medium text-brand-blue-800 mb-1">Learning Pattern</h4>
            <p className="text-sm text-brand-blue-700">You prefer visual content over text. Try more video-based learning for better retention.</p>
          </div>
          <div className="p-3 bg-white rounded-lg">
            <h4 className="font-medium text-brand-blue-800 mb-1">Recommendation</h4>
            <p className="text-sm text-brand-blue-700">Focus on Physics this week - it's been neglected and other subjects show strong progress.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
