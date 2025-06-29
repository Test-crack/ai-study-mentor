
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Book, Plus, Star } from "lucide-react";

export const NotesUpload = () => {
  const [uploadedNotes, setUploadedNotes] = useState([
    {
      id: 1,
      title: "Introduction to Psychology",
      summary: "Key concepts about human behavior, cognitive processes, and psychological theories.",
      keyTopics: ["Behavioral Psychology", "Cognitive Development", "Memory Systems"],
      studyTime: "15 min",
      difficulty: "Beginner",
      aiInsights: "Focus on memory consolidation techniques for better retention"
    },
    {
      id: 2,
      title: "Calculus Fundamentals",
      summary: "Derivatives, integrals, and their applications in real-world scenarios.",
      keyTopics: ["Derivatives", "Integration", "Limits"],
      studyTime: "25 min",
      difficulty: "Intermediate",
      aiInsights: "Practice more integration by parts - detected as weak area"
    }
  ]);

  const handleFileUpload = () => {
    // Simulate file upload
    const newNote = {
      id: Date.now(),
      title: "Uploaded Document",
      summary: "AI is analyzing your document...",
      keyTopics: ["Analysis in progress..."],
      studyTime: "Calculating...",
      difficulty: "TBD",
      aiInsights: "Processing your content to provide personalized insights..."
    };
    setUploadedNotes([newNote, ...uploadedNotes]);
  };

  return (
    <div className="space-y-6">
      <div className="text-center space-y-4">
        <h2 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
          Smart Notes Analysis
        </h2>
        <p className="text-muted-foreground">
          Upload your study materials and let AI create personalized learning experiences
        </p>
      </div>

      {/* Upload Section */}
      <Card className="border-2 border-dashed border-purple-200 bg-gradient-to-br from-purple-50 to-blue-50">
        <CardContent className="flex flex-col items-center justify-center py-12">
          <div className="p-4 bg-gradient-to-br from-purple-100 to-blue-100 rounded-full mb-4">
            <Plus className="h-8 w-8 text-purple-600" />
          </div>
          <h3 className="text-xl font-semibold mb-2">Upload Your Notes</h3>
          <p className="text-muted-foreground text-center mb-6">
            Drag & drop files or click to browse<br />
            Supports PDF, DOCX, TXT, and image files
          </p>
          <Button onClick={handleFileUpload} className="bg-gradient-to-r from-purple-500 to-blue-500">
            <Plus className="h-4 w-4 mr-2" />
            Choose Files
          </Button>
        </CardContent>
      </Card>

      {/* Uploaded Notes */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold">Your Study Materials</h3>
        {uploadedNotes.map((note) => (
          <Card key={note.id} className="hover:shadow-lg transition-all duration-300">
            <CardHeader>
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <CardTitle className="flex items-center space-x-2">
                    <Book className="h-5 w-5 text-purple-600" />
                    <span>{note.title}</span>
                  </CardTitle>
                  <CardDescription className="mt-2">{note.summary}</CardDescription>
                </div>
                <Badge variant="outline" className="ml-4">
                  {note.difficulty}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Key Topics */}
              <div>
                <h4 className="font-medium mb-2">Key Topics</h4>
                <div className="flex flex-wrap gap-2">
                  {note.keyTopics.map((topic, index) => (
                    <Badge key={index} variant="secondary">
                      {topic}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* AI Insights */}
              <div className="bg-gradient-to-r from-purple-50 to-blue-50 p-4 rounded-lg">
                <div className="flex items-center space-x-2 mb-2">
                  <Star className="h-4 w-4 text-purple-600" />
                  <h4 className="font-medium text-purple-800">AI Insight</h4>
                </div>
                <p className="text-sm text-purple-700">{note.aiInsights}</p>
              </div>

              {/* Study Actions */}
              <div className="flex justify-between items-center pt-4 border-t">
                <span className="text-sm text-muted-foreground">
                  Estimated study time: {note.studyTime}
                </span>
                <div className="flex space-x-2">
                  <Button variant="outline" size="sm">
                    Create Quiz
                  </Button>
                  <Button size="sm" className="bg-gradient-to-r from-purple-500 to-blue-500">
                    Start Learning
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};
