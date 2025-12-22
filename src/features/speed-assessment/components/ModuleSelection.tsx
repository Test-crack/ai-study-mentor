import { Button } from "@/shared/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/components/ui/select";
import { Label } from "@/shared/components/ui/label";
import { BookOpen, Target, Award, Loader2 } from "lucide-react";
import { ReadingModule } from "@/features/reading-assessment/services/reading-api";

interface ModuleSelectionProps {
  modules: ReadingModule[];
  selectedModule: string;
  selectedDifficulty: string;
  loading: boolean;
  loadingModules: boolean;
  onModuleChange: (moduleId: string) => void;
  onDifficultyChange: (difficulty: string) => void;
  onStartAssessment: () => void;
}

export const ModuleSelection = ({
  modules,
  selectedModule,
  selectedDifficulty,
  loading,
  loadingModules,
  onModuleChange,
  onDifficultyChange,
  onStartAssessment
}: ModuleSelectionProps) => {
  if (loadingModules) {
    return (
      <Card className="max-w-2xl mx-auto">
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin mb-4" />
          <p className="text-muted-foreground">Loading reading modules...</p>
        </CardContent>
      </Card>
    );
  }

  const selectedModuleData = modules.find(m => m.id === selectedModule);

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader className="text-center">
        <CardTitle className="text-3xl bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
          Reading Speed Assessment
        </CardTitle>
        <CardDescription className="text-lg">
          Choose a module and difficulty to test your reading speed and comprehension
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <Label htmlFor="module" className="text-lg font-medium">Select a Module:</Label>
          <Select onValueChange={onModuleChange}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Choose a reading module" />
            </SelectTrigger>
            <SelectContent>
              {modules.map((module) => (
                <SelectItem key={module.id} value={module.id}>
                  <div className="flex flex-col">
                    <span className="font-medium">{module.name}</span>
                    <span className="text-sm text-muted-foreground">{module.description}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        {selectedModuleData && (
          <div className="space-y-4">
            <Label htmlFor="difficulty" className="text-lg font-medium">Select Difficulty:</Label>
            <Select onValueChange={onDifficultyChange}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Choose difficulty level" />
              </SelectTrigger>
              <SelectContent>
                {selectedModuleData.difficulties.map((difficulty) => (
                  <SelectItem key={difficulty} value={difficulty}>
                    <span className="capitalize">{difficulty}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 py-6">
          <div className="text-center space-y-2">
            <BookOpen className="h-8 w-8 mx-auto text-purple-600" />
            <h3 className="font-semibold">Read</h3>
            <p className="text-sm text-muted-foreground">Self-paced reading</p>
          </div>
          <div className="text-center space-y-2">
            <Target className="h-8 w-8 mx-auto text-blue-600" />
            <h3 className="font-semibold">Answer</h3>
            <p className="text-sm text-muted-foreground">Comprehension questions</p>
          </div>
          <div className="text-center space-y-2">
            <Award className="h-8 w-8 mx-auto text-green-600" />
            <h3 className="font-semibold">Results</h3>
            <p className="text-sm text-muted-foreground">Get your speed score</p>
          </div>
        </div>
        
        <Button 
          onClick={onStartAssessment} 
          disabled={!selectedModule || !selectedDifficulty || loading}
          className="w-full bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Loading Passage...
            </>
          ) : (
            "Start Assessment"
          )}
        </Button>
      </CardContent>
    </Card>
  );
};
