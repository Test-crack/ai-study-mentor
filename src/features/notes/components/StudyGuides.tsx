
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Button } from "@/shared/components/ui/button";
import { Badge } from "@/shared/components/ui/badge";
import { Progress } from "@/shared/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/components/ui/select";
import { BookOpen, Star, Plus, Check, FileText, Video, Loader2 } from "lucide-react";
import { useToast } from "@/shared/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface StudyGuide {
  id: string;
  title: string;
  subject: string;
  difficulty: string;
  estimatedTime: string;
  learningObjectives: string[];
  topics: Array<{
    name: string;
    summary: string;
    keyPoints: string[];
    practiceQuestions: string[];
    completed?: boolean;
  }>;
  studyPlan: {
    week1: string;
    week2: string;
    week3: string;
  };
  resources: string[];
  aiInsights: string;
  createdAt: string;
  progress: number;
  lastUpdated?: string;
  totalTopics?: number;
  completedTopics?: number;
  aiRecommendation?: string;
}

export const StudyGuides = () => {
  const [studyGuides, setStudyGuides] = useState<StudyGuide[]>([]);
  const [sourceNotes, setSourceNotes] = useState<any[]>([]);
  const [selectedSource, setSelectedSource] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const { toast } = useToast();

  // Load user's notes and existing study guides
  useEffect(() => {
    loadSourceContent();
    loadStudyGuides();
  }, []);

  const loadSourceContent = async () => {
    try {
      const { data: notes, error } = await supabase
        .from('notes')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setSourceNotes(notes || []);
    } catch (error) {
      console.error('Error loading source content:', error);
    }
  };

  const loadStudyGuides = async () => {
    // For now, use mock data. In production, this would load from database
    const mockGuides: StudyGuide[] = [
      {
        id: "1",
        title: "AI-Generated Study Guide",
        subject: "Computer Science",
        difficulty: "Intermediate", 
        estimatedTime: "3h 30m",
        learningObjectives: [
          "Understand core AI concepts",
          "Apply machine learning principles",
          "Analyze algorithm performance"
        ],
        topics: [
          {
            name: "Machine Learning Basics",
            summary: "Introduction to ML algorithms and concepts",
            keyPoints: ["Supervised learning", "Unsupervised learning", "Model evaluation"],
            practiceQuestions: ["What is overfitting?", "Compare classification vs regression"],
            completed: false
          }
        ],
        studyPlan: {
          week1: "Master foundational concepts and terminology",
          week2: "Practice implementing basic algorithms",
          week3: "Work on real-world applications and case studies"
        },
        resources: ["Original uploaded notes", "Recommended online courses"],
        aiInsights: "Focus on hands-on practice to reinforce theoretical concepts. Consider working through coding examples.",
        createdAt: "2024-01-15",
        progress: 45,
        lastUpdated: "2 days ago",
        totalTopics: 3,
        completedTopics: 1,
        aiRecommendation: "Focus on hands-on practice to reinforce theoretical concepts. Consider working through coding examples."
      }
    ];
    setStudyGuides(mockGuides);
  };

  const generateStudyGuide = async () => {
    if (!selectedSource) {
      toast({
        title: "Select source material",
        description: "Please choose a note or content to generate a study guide from.",
        variant: "destructive"
      });
      return;
    }

    setIsGenerating(true);

    try {
      const sourceNote = sourceNotes.find(note => note.id === selectedSource);
      if (!sourceNote) throw new Error('Source note not found');

      const { data, error } = await supabase.functions.invoke('generate-study-guide', {
        body: {
          content: sourceNote.content || sourceNote.summary,
          title: sourceNote.title,
          contentType: 'uploaded notes'
        }
      });

      if (error) throw error;

      const newGuide: StudyGuide = {
        id: Date.now().toString(),
        ...data,
        createdAt: new Date().toISOString(),
        progress: 0
      };

      setStudyGuides(prev => [newGuide, ...prev]);
      setShowCreateForm(false);
      setSelectedSource("");

      toast({
        title: "Study guide generated!",
        description: "Your personalized study guide is ready for use."
      });

    } catch (error: any) {
      console.error('Error generating study guide:', error);
      toast({
        title: "Generation failed",
        description: "Failed to generate study guide. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

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
          {showCreateForm ? (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold mb-2">Generate Study Guide</h3>
              <div className="space-y-2">
                <label className="text-sm font-medium">Select source material:</label>
                <Select value={selectedSource} onValueChange={setSelectedSource}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose from your uploaded notes" />
                  </SelectTrigger>
                  <SelectContent>
                    {sourceNotes.map((note) => (
                      <SelectItem key={note.id} value={note.id}>
                        <div className="flex items-center space-x-2">
                          <FileText className="h-4 w-4" />
                          <span>{note.title}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex space-x-2">
                <Button 
                  onClick={generateStudyGuide}
                  className="bg-gradient-to-r from-green-500 to-blue-500"
                  disabled={isGenerating || !selectedSource}
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Plus className="h-4 w-4 mr-2" />
                      Generate Guide
                    </>
                  )}
                </Button>
                <Button variant="outline" onClick={() => setShowCreateForm(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <>
              <h3 className="text-lg font-semibold mb-2">Create New Study Guide</h3>
              <p className="text-muted-foreground text-center mb-4">
                Generate a personalized study guide from your notes or choose a topic
              </p>
              <Button 
                className="bg-gradient-to-r from-green-500 to-blue-500"
                onClick={() => setShowCreateForm(true)}
              >
                <Plus className="h-4 w-4 mr-2" />
                Generate Guide
              </Button>
            </>
          )}
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
                      Updated {guide.lastUpdated || 'Recently'}
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
                  <span>Progress: {guide.completedTopics || 0}/{guide.totalTopics || guide.topics.length} topics</span>
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
                <p className="text-sm text-blue-700">{guide.aiInsights}</p>
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
