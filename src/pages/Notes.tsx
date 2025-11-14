import { useState, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { getBackendUrl } from "@/lib/api-utils";
import UploadedFileCard from "@/components/UploadedFileCard";
import GeneratedNotesDisplay from "@/components/GeneratedNotesDisplay";
import { 
  Plus, 
  Upload, 
  FileText, 
  Loader2, 
  Zap
} from "lucide-react";

interface FileInfo {
  name: string;
  originalPath: string;
  extractedPath: string;
  type: string;
  size: number;
  lastModified: number;
}

interface GeneratedNote {
  materialType: 'overview' | 'standard' | 'detailed';
  markdown: string;
  fileName: string;
  timestamp: number;
}

export default function Notes() {
  const [loading, setLoading] = useState(false);
  const [uploadingFiles, setUploadingFiles] = useState<Set<string>>(new Set());
  const [uploadedFiles, setUploadedFiles] = useState<FileInfo[]>([]);
  const [generatedNotes, setGeneratedNotes] = useState<GeneratedNote[]>([]);
  const [generatingNotes, setGeneratingNotes] = useState<Map<string, string>>(new Map());
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  // Handle file upload with individual error handling for each file
  const handleFileUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    
    const fileArray = Array.from(files);
    setLoading(true);
    
    let successCount = 0;
    let failureCount = 0;
    const errors: string[] = [];

    // Process each file individually with its own try/catch
    for (const file of fileArray) {
      // Skip files that are too large
      if (file.size > 50 * 1024 * 1024) {
        failureCount++;
        errors.push(`${file.name}: exceeds 50MB limit`);
        toast({
          title: "File too large",
          description: `${file.name} exceeds the 50MB limit`,
          variant: "destructive"
        });
        continue;
      }

      // Add file to uploading set
      setUploadingFiles(prev => new Set(prev).add(file.name));

      try {
        const backendUrl = getBackendUrl();
        const formData = new FormData();
        
        // Append file
        formData.append('file', file);
        
        // Append metadata
        formData.append('fileName', file.name);
        formData.append('fileType', file.type);
        formData.append('fileSize', file.size.toString());
        formData.append('lastModified', file.lastModified.toString());

        const response = await fetch(`${backendUrl}/api/smartNotes/upload`, {
          method: 'POST',
          body: formData
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || `Upload failed: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        successCount++;
        
        // Add to uploaded files if we have fileInfo
        if (data.fileInfo) {
          setUploadedFiles(prev => [...prev, data.fileInfo]);
        }
        
        toast({
          title: "Upload successful",
          description: `${file.name} has been uploaded and text extraction is in progress`,
        });

      } catch (error) {
        // Individual file error - doesn't break the batch
        failureCount++;
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        errors.push(`${file.name}: ${errorMessage}`);
        
        console.error(`Upload error for ${file.name}:`, error);
        toast({
          title: `Upload failed: ${file.name}`,
          description: errorMessage,
          variant: "destructive"
        });
      } finally {
        // Remove file from uploading set
        setUploadingFiles(prev => {
          const newSet = new Set(prev);
          newSet.delete(file.name);
          return newSet;
        });
      }
    }

    // Show summary if multiple files were uploaded
    if (fileArray.length > 1) {
      if (successCount > 0 && failureCount === 0) {
        toast({
          title: "All files uploaded successfully",
          description: `${successCount} file(s) uploaded and processing started`,
        });
      } else if (successCount > 0 && failureCount > 0) {
        toast({
          title: "Partial upload success",
          description: `${successCount} succeeded, ${failureCount} failed. Check individual notifications for details.`,
          variant: "default"
        });
      } else if (failureCount > 0) {
        toast({
          title: "All uploads failed",
          description: `${failureCount} file(s) failed to upload`,
          variant: "destructive"
        });
      }
    }

    setLoading(false);
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

  const generateNotes = async (
    fileInfo: FileInfo, 
    materialType: 'overview' | 'standard' | 'detailed'
  ) => {
    const key = `${fileInfo.extractedPath}-${materialType}`;
    
    // Check if already generating
    if (generatingNotes.has(key)) {
      toast({
        title: "Already generating",
        description: `${materialType} notes for ${fileInfo.name} are already being generated`,
        variant: "default"
      });
      return;
    }

    // Mark as generating
    setGeneratingNotes(prev => new Map(prev).set(key, fileInfo.name));

    toast({
      title: "Generating notes",
      description: `Creating ${materialType} notes for ${fileInfo.name}...`,
    });

    try {
      const backendUrl = getBackendUrl();
      const response = await fetch(`${backendUrl}/api/smartNotes/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          extractedPath: fileInfo.extractedPath,
          materialType: materialType
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Generation failed: ${response.status}`);
      }

      const data = await response.json();

      if (data.success && data.markdown) {
        const newNote: GeneratedNote = {
          materialType: data.materialType,
          markdown: data.markdown,
          fileName: fileInfo.name,
          timestamp: Date.now()
        };

        setGeneratedNotes(prev => [newNote, ...prev]);

        toast({
          title: "Notes generated successfully",
          description: `${materialType} notes for ${fileInfo.name} are ready`,
        });
      } else {
        throw new Error('Invalid response format');
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      console.error(`Generation error for ${fileInfo.name}:`, error);
      
      toast({
        title: "Generation failed",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      // Remove from generating set
      setGeneratingNotes(prev => {
        const newMap = new Map(prev);
        newMap.delete(key);
        return newMap;
      });
    }
  };

  const handleGenerateOverview = (fileInfo: FileInfo) => {
    generateNotes(fileInfo, 'overview');
  };

  const handleGenerateStandardNotes = (fileInfo: FileInfo) => {
    generateNotes(fileInfo, 'standard');
  };

  const handleGenerateDeepDive = (fileInfo: FileInfo) => {
    generateNotes(fileInfo, 'detailed');
  };

  const handleGenerateQuiz = (fileInfo: FileInfo) => {
    toast({
      title: "Coming soon",
      description: "Quiz generation will be available soon!",
    });
  };

  const handleCloseNote = (index: number) => {
    setGeneratedNotes(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          {/* Header */}
          <div className="text-center space-y-4">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
              Notes Management
            </h1>
            <p className="text-xl text-muted-foreground">
              Upload your study materials and let AI extract key insights
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
                {loading ? (
                  <Upload className="h-8 w-8 text-purple-600 animate-pulse" />
                ) : (
                  <Plus className="h-8 w-8 text-purple-600" />
                )}
              </div>
              <h3 className="text-xl font-semibold mb-2">Upload Your Study Material</h3>
              <p className="text-muted-foreground text-center mb-6">
                AI will extract key concepts, create study guides, and build your learning path<br />
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
                    Uploading...
                  </>
                ) : (
                  <>
                    <Zap className="h-4 w-4 mr-2" />
                    Upload Files
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

          {/* Upload Status */}
          {uploadingFiles.size > 0 && (
            <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
              <CardHeader>
                <CardTitle className="text-sm">Uploading Files</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {Array.from(uploadingFiles).map((fileName) => (
                    <div key={fileName} className="flex items-center space-x-2 text-sm">
                      <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                      <span className="text-muted-foreground">{fileName}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Generating Status */}
          {generatingNotes.size > 0 && (
            <Card className="bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200">
              <CardHeader>
                <CardTitle className="text-sm flex items-center space-x-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Generating Notes</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {Array.from(generatingNotes.entries()).map(([key, fileName]) => {
                    const materialType = key.split('-').pop();
                    return (
                      <div key={key} className="flex items-center space-x-2 text-sm">
                        <Loader2 className="h-4 w-4 animate-spin text-purple-600" />
                        <span className="text-muted-foreground">
                          {materialType} notes for {fileName}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Generated Notes */}
          {generatedNotes.length > 0 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-semibold">Generated Notes</h2>
              {generatedNotes.map((note, index) => (
                <GeneratedNotesDisplay
                  key={`${note.fileName}-${note.materialType}-${index}`}
                  note={note}
                  onClose={() => handleCloseNote(index)}
                />
              ))}
            </div>
          )}

          {/* Uploaded Files */}
          {uploadedFiles.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-2xl font-semibold">Uploaded Files</h2>
              {uploadedFiles.map((fileInfo, index) => {
                const overviewKey = `${fileInfo.extractedPath}-overview`;
                const standardKey = `${fileInfo.extractedPath}-standard`;
                const detailedKey = `${fileInfo.extractedPath}-detailed`;
                
                return (
                  <UploadedFileCard
                    key={`${fileInfo.name}-${index}`}
                    fileInfo={fileInfo}
                    onGenerateOverview={() => handleGenerateOverview(fileInfo)}
                    onGenerateStandardNotes={() => handleGenerateStandardNotes(fileInfo)}
                    onGenerateDeepDive={() => handleGenerateDeepDive(fileInfo)}
                    onGenerateQuiz={() => handleGenerateQuiz(fileInfo)}
                    isGeneratingOverview={generatingNotes.has(overviewKey)}
                    isGeneratingStandard={generatingNotes.has(standardKey)}
                    isGeneratingDeepDive={generatingNotes.has(detailedKey)}
                  />
                );
              })}
            </div>
          )}

          {/* Info Section */}
          {uploadedFiles.length === 0 && (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <FileText className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground text-center">
                  Upload your files to begin text extraction<br />
                  Notes will be generated after text extraction is complete
                </p>
              </CardContent>
            </Card>
          )}

        </div>
      </div>
    </div>
  );
}
