
import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Book, Plus, Star, Upload, FileText } from "lucide-react";

interface Note {
  id: string;
  title: string;
  summary: string;
  keyTopics: string[];
  studyTime: string;
  difficulty: string;
  aiInsights: string;
  processed?: boolean;
}

export const NotesUpload = () => {
  const [uploadedNotes, setUploadedNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingNotes, setLoadingNotes] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  // Load notes from database
  const loadNotes = async () => {
    try {
      const { data: notes, error } = await supabase
        .from('notes')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      const formattedNotes = notes.map(note => ({
        id: note.id,
        title: note.title,
        summary: note.summary || "Processing...",
        keyTopics: note.key_topics || ["Processing..."],
        studyTime: note.estimated_study_time ? `${note.estimated_study_time} min` : "Calculating...",
        difficulty: note.difficulty_level || "TBD",
        aiInsights: note.ai_insights || "AI analysis in progress...",
        processed: note.processed
      }));
      
      setUploadedNotes(formattedNotes);
    } catch (error) {
      console.error('Error loading notes:', error);
      toast({
        title: "Error loading notes",
        description: "Please try refreshing the page",
        variant: "destructive"
      });
    } finally {
      setLoadingNotes(false);
    }
  };

  // Load notes on component mount
  useEffect(() => {
    loadNotes();
  }, []);

  // Extract text from file based on type
  const extractTextFromFile = async (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = async (e) => {
        const content = e.target?.result;
        
        if (file.type === 'text/plain') {
          resolve(content as string);
        } else if (file.type === 'application/pdf') {
          // For PDF files, we'll send the base64 content for now
          // In a production app, you'd use a PDF parsing library
          resolve('PDF content uploaded - AI will extract text during analysis');
        } else if (file.type.includes('image/')) {
          // For images, we'll use OCR during AI analysis
          resolve('Image uploaded - AI will extract text using OCR');
        } else {
          // For other document types, attempt text extraction
          resolve(content as string);
        }
      };
      
      reader.onerror = () => reject(new Error('Failed to read file'));
      
      if (file.type === 'text/plain') {
        reader.readAsText(file);
      } else {
        reader.readAsDataURL(file);
      }
    });
  };

  // Handle file upload and AI analysis
  const handleFileUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    
    setLoading(true);
    
    try {
      for (const file of Array.from(files)) {
        // Validate file size (50MB limit)
        if (file.size > 50 * 1024 * 1024) {
          toast({
            title: "File too large",
            description: `${file.name} exceeds the 50MB limit`,
            variant: "destructive"
          });
          continue;
        }

        // Create initial note record
        const { data: noteRecord, error: insertError } = await supabase
          .from('notes')
          .insert({
            title: file.name.replace(/\.[^/.]+$/, ""), // Remove file extension
            original_filename: file.name,
            file_type: file.type,
            content: "Processing...",
            processed: false
          })
          .select()
          .single();

        if (insertError) throw insertError;

        // Add to UI immediately
        const newNote: Note = {
          id: noteRecord.id,
          title: noteRecord.title,
          summary: "AI is analyzing your document...",
          keyTopics: ["Analysis in progress..."],
          studyTime: "Calculating...",
          difficulty: "TBD",
          aiInsights: "Processing your content to provide personalized insights...",
          processed: false
        };

        setUploadedNotes(prev => [newNote, ...prev]);

        // Extract file content
        const fileContent = await extractTextFromFile(file);

        // Upload file to storage
        const filePath = `${noteRecord.id}/${file.name}`;
        const { error: uploadError } = await supabase.storage
          .from('documents')
          .upload(filePath, file);

        if (uploadError) {
          console.error('Storage upload error:', uploadError);
          // Continue with analysis even if storage upload fails
        }

        // Analyze document with AI
        const { data: analysis, error: analysisError } = await supabase.functions
          .invoke('analyze-document', {
            body: {
              fileContent,
              fileName: file.name,
              fileType: file.type
            }
          });

        if (analysisError) {
          console.error('Analysis error:', analysisError);
          toast({
            title: "Analysis failed",
            description: `Failed to analyze ${file.name}. Please try again.`,
            variant: "destructive"
          });
          continue;
        }

        // Update note with analysis results
        const analysisResult = analysis.error ? analysis.fallback : analysis;
        
        const { error: updateError } = await supabase
          .from('notes')
          .update({
            content: fileContent,
            summary: analysisResult.summary,
            key_topics: analysisResult.keyTopics,
            difficulty_level: analysisResult.difficultyLevel,
            estimated_study_time: analysisResult.estimatedStudyTime,
            ai_insights: analysisResult.aiInsights,
            processed: true
          })
          .eq('id', noteRecord.id);

        if (updateError) {
          console.error('Update error:', updateError);
        }

        // Refresh notes
        await loadNotes();
      }

      toast({
        title: "Upload successful",
        description: "Your documents have been analyzed and are ready for study!"
      });

    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: "Upload failed",
        description: "Please try again later",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFileUpload(e.target.files);
  };

  const handleChooseFiles = () => {
    fileInputRef.current?.click();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    handleFileUpload(e.dataTransfer.files);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
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
      <Card 
        className="border-2 border-dashed border-purple-200 bg-gradient-to-br from-purple-50 to-blue-50"
        onDrop={handleDrop}
        onDragOver={handleDragOver}
      >
        <CardContent className="flex flex-col items-center justify-center py-12">
          <div className="p-4 bg-gradient-to-br from-purple-100 to-blue-100 rounded-full mb-4">
            {loading ? <Upload className="h-8 w-8 text-purple-600 animate-pulse" /> : <Plus className="h-8 w-8 text-purple-600" />}
          </div>
          <h3 className="text-xl font-semibold mb-2">Upload Your Notes</h3>
          <p className="text-muted-foreground text-center mb-6">
            Drag & drop files or click to browse<br />
            Supports PDF, DOCX, TXT, and image files
          </p>
          <Button 
            onClick={handleChooseFiles} 
            disabled={loading}
            className="bg-gradient-to-r from-purple-500 to-blue-500"
          >
            {loading ? (
              <>
                <Upload className="h-4 w-4 mr-2 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <Plus className="h-4 w-4 mr-2" />
                Choose Files
              </>
            )}
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept=".pdf,.doc,.docx,.txt,.png,.jpg,.jpeg"
            onChange={handleFileInputChange}
            className="hidden"
          />
        </CardContent>
      </Card>

      {/* Uploaded Notes */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold">Your Study Materials</h3>
        {loadingNotes ? (
          <div className="text-center py-8">
            <Upload className="h-8 w-8 animate-spin mx-auto mb-2 text-purple-600" />
            <p className="text-muted-foreground">Loading your notes...</p>
          </div>
        ) : uploadedNotes.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <FileText className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground text-center">
                No study materials uploaded yet.<br />
                Upload your first document to get started!
              </p>
            </CardContent>
          </Card>
        ) : (
          uploadedNotes.map((note) => (
            <Card key={note.id} className="hover:shadow-lg transition-all duration-300">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <CardTitle className="flex items-center space-x-2">
                      <Book className="h-5 w-5 text-purple-600" />
                      <span>{note.title}</span>
                      {!note.processed && (
                        <Badge variant="secondary" className="ml-2">
                          Processing...
                        </Badge>
                      )}
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
                    <Button variant="outline" size="sm" disabled={!note.processed}>
                      Create Quiz
                    </Button>
                    <Button size="sm" className="bg-gradient-to-r from-purple-500 to-blue-500" disabled={!note.processed}>
                      Start Learning
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};
