
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { BookOpen, Star, Plus, Check } from "lucide-react";

export const StudyGuides = () => {
  const [studyGuides, setStudyGuides] = useState([
    {
      id: 1,
      title: "Psychology Fundamentals Mastery",
      subject: "Psychology",
      progress: 65,
      totalTopics: 12,
      completedTopics: 8,
      estimatedTime: "3h 20m",
      difficulty: "Intermediate",
      lastUpdated: "2 days ago",
      aiRecommendation: "Focus on cognitive biases section - detected knowledge gap",
      topics: [
        { name: "Introduction to Psychology", completed: true },
        { name: "Research Methods", completed: true },
        { name: "Biological Psychology", completed: true },
        { name: "Sensation and Perception", completed: false },
        { name: "Learning and Memory", completed: false }
      ]
    },
    {
      id: 2,
      title: "Calculus Complete Guide",
      subject: "Mathematics",
      progress: 40,
      totalTopics: 15,
      completedTopics: 6,
      estimatedTime: "5h 45m",
      difficulty: "Advanced",
      lastUpdated: "1 week ago",
      aiRecommendation: "Practice more integration problems - low confidence detected",
      topics: [
        { name: "Limits and Continuity", completed: true },
        { name: "Derivatives", completed: true },
        { name: "Applications of Derivatives", completed: false },
        { name: "Integration", completed: false },
        { name: "Series and Sequences", completed: false }
      ]
    },
    {
      id: 3,
      title: "World History Timeline",
      subject: "History",
      progress: 85,
      totalTopics: 10,
      completedTopics: 8,
      estimatedTime: "2h 15m",
      difficulty: "Beginner",
      lastUpdated: "3 days ago",
      aiRecommendation: "Excellent progress! Review Industrial Revolution for final mastery",
      topics: [
        { name: "Ancient Civilizations", completed: true },
        { name: "Medieval Period", completed: true },
        { name: "Renaissance", completed: true },
        { name: "Industrial Revolution", completed: false },
        { name: "Modern Era", completed: true }
      ]
    }
  ]);

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "Beginner": return "bg-green-100 text-green-700";
      case "Intermediate": return "bg-yellow-100 text-yellow-700";
      case "Advanced": return "bg-red-100 text-red-700";
      default: return "bg-gray-100 text-gray-700";
    }
  };

  const getProgressColor = (progress: number) => {
    if (progress >= 80) return "bg-green-500";
    if (progress >= 60) return "bg-yellow-500";
    return "bg-blue-500";
  };

  return (
    <div className="space-y-6">
      <div className="text-center space-y-4">
        <h2 className="text-3xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
          Personalized Study Guides
        </h2>
        <p className="text-muted-foreground">
          AI-generated study paths tailored to your learning style and goals
        </p>
      </div>

      {/* Create New Guide */}
      <Card className="border-2 border-dashed border-green-200 bg-gradient-to-br from-green-50 to-blue-50">
        <CardContent className="flex flex-col items-center justify-center py-8">
          <div className="p-4 bg-gradient-to-br from-green-100 to-blue-100 rounded-full mb-4">
            <Plus className="h-6 w-6 text-green-600" />
          </div>
          <h3 className="text-lg font-semibold mb-2">Create New Study Guide</h3>
          <p className="text-muted-foreground text-center mb-4">
            Generate a personalized study guide from your notes or choose a topic
          </p>
          <Button className="bg-gradient-to-r from-green-500 to-blue-500">
            <Plus className="h-4 w-4 mr-2" />
            Generate Guide
          </Button>
        </CardContent>
      </Card>

      {/* Study Guides List */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold">Your Study Guides</h3>
        {studyGuides.map((guide) => (
          <Card key={guide.id} className="hover:shadow-lg transition-all duration-300">
            <CardHeader>
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <CardTitle className="flex items-center space-x-2">
                    <BookOpen className="h-5 w-5 text-green-600" />
                    <span>{guide.title}</span>
                  </CardTitle>
                  <div className="flex items-center space-x-4 mt-2">
                    <Badge variant="outline">{guide.subject}</Badge>
                    <Badge className={getDifficultyColor(guide.difficulty)}>
                      {guide.difficulty}
                    </Badge>
                    <span className="text-sm text-muted-foreground">
                      Updated {guide.lastUpdated}
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-green-600">{guide.progress}%</div>
                  <div className="text-sm text-muted-foreground">Complete</div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Progress Bar */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Progress: {guide.completedTopics}/{guide.totalTopics} topics</span>
                  <span>Est. time: {guide.estimatedTime}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all duration-300 ${getProgressColor(guide.progress)}`}
                    style={{ width: `${guide.progress}%` }}
                  ></div>
                </div>
              </div>

              {/* Topics Preview */}
              <div>
                <h4 className="font-medium mb-2">Recent Topics</h4>
                <div className="space-y-1">
                  {guide.topics.slice(0, 3).map((topic, index) => (
                    <div key={index} className="flex items-center space-x-2 text-sm">
                      <div className={`w-4 h-4 rounded-full flex items-center justify-center ${
                        topic.completed ? 'bg-green-500' : 'bg-gray-300'
                      }`}>
                        {topic.completed && <Check className="h-2 w-2 text-white" />}
                      </div>
                      <span className={topic.completed ? 'line-through text-muted-foreground' : ''}>
                        {topic.name}
                      </span>
                    </div>
                  ))}
                  {guide.topics.length > 3 && (
                    <div className="text-xs text-muted-foreground ml-6">
                      +{guide.topics.length - 3} more topics
                    </div>
                  )}
                </div>
              </div>

              {/* AI Recommendation */}
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-4 rounded-lg">
                <div className="flex items-center space-x-2 mb-2">
                  <Star className="h-4 w-4 text-blue-600" />
                  <h4 className="font-medium text-blue-800">AI Recommendation</h4>
                </div>
                <p className="text-sm text-blue-700">{guide.aiRecommendation}</p>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-between items-center pt-4 border-t">
                <div className="flex space-x-2">
                  <Button variant="outline" size="sm">
                    View All Topics
                  </Button>
                  <Button variant="outline" size="sm">
                    Export PDF
                  </Button>
                </div>
                <Button size="sm" className="bg-gradient-to-r from-green-500 to-blue-500">
                  Continue Learning
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Study Guide Features */}
      <Card className="bg-gradient-to-r from-green-500 to-blue-600 text-white">
        <CardContent className="p-6">
          <h3 className="text-xl font-bold mb-4">Smart Study Guide Features</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
            <div>
              <h4 className="font-semibold mb-1">Adaptive Learning</h4>
              <p className="text-green-100">Adjusts difficulty based on your progress</p>
            </div>
            <div>
              <h4 className="font-semibold mb-1">Smart Scheduling</h4>
              <p className="text-green-100">Optimal review timing for long-term retention</p>
            </div>
            <div>
              <h4 className="font-semibold mb-1">Weakness Detection</h4>
              <p className="text-green-100">Identifies and targets knowledge gaps</p>
            </div>
            <div>
              <h4 className="font-semibold mb-1">Progress Tracking</h4>
              <p className="text-green-100">Detailed analytics on your learning journey</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
