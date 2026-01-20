import { useState, useEffect } from "react";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from "@/shared/components/ui/dialog";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/shared/components/ui/select";
import { coursesService } from "../../services/coursesService";
import { toast } from "@/shared/hooks/use-toast";
import { DifficultyType } from "../../types";
import { useQueryClient } from "@tanstack/react-query";
import { Loader2, Sparkles, BookOpen, GraduationCap, IndianRupee } from "lucide-react";

interface CreateCourseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateCourseDialog({ open, onOpenChange }: CreateCourseDialogProps) {
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [domains, setDomains] = useState<{ id: string; name: string }[]>([]);
  const [formData, setFormData] = useState({
    title: "",
    domainId: "",
    difficulty: DifficultyType.BEGINNER,
    price: 0
  });

  useEffect(() => {
    if (open) {
      const fetchDomains = async () => {
        try {
          const data = await coursesService.getDomains();
          setDomains(data);
        } catch (error) {
          console.error("Failed to fetch domains", error);
        }
      };
      fetchDomains();
    }
  }, [open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.domainId) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields.",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await coursesService.createCourse({
        title: formData.title,
        domainId: formData.domainId,
        difficulty: formData.difficulty,
        price: formData.price,
      });
      
      toast({
        title: "Course Created!",
        description: `${formData.title} has been added to your courses.`,
      });
      
      queryClient.invalidateQueries({ queryKey: ["instructor-courses"] });
      onOpenChange(false);
      setFormData({
        title: "",
        domainId: "",
        difficulty: DifficultyType.BEGINNER,
        price: 0
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create course. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] border-slate-100 rounded-3xl p-0 overflow-hidden bg-white">
        <div className="bg-indigo-600 p-8 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 -tr-y-1/2 translate-x-1/4 opacity-10">
              <Sparkles className="h-48 w-48" />
          </div>
          <DialogHeader className="relative z-10">
            <DialogTitle className="text-2xl font-extrabold flex items-center gap-3">
              <BookOpen className="h-6 w-6 text-indigo-200" />
              Create New Course
            </DialogTitle>
            <DialogDescription className="text-indigo-100 font-medium">
              Start building your next educational masterpiece.
            </DialogDescription>
          </DialogHeader>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title" className="text-slate-700 font-bold flex items-center gap-2">
                Course Title
                <span className="text-rose-500">*</span>
              </Label>
              <Input
                id="title"
                placeholder="e.g. Master Advanced Frontend Architecture"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="h-12 rounded-xl border-slate-100 bg-slate-50/50 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 transition-all font-medium"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="domain" className="text-slate-700 font-bold flex items-center gap-2">
                  <GraduationCap className="h-4 w-4 text-indigo-500" />
                  Domain
                  <span className="text-rose-500">*</span>
                </Label>
                <Select
                  value={formData.domainId}
                  onValueChange={(val) => setFormData({ ...formData, domainId: val })}
                >
                  <SelectTrigger id="domain" className="h-12 rounded-xl border-slate-100 bg-slate-50/50 focus:bg-white transition-all font-medium">
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-slate-100 shadow-xl">
                    {domains.map((domain) => (
                      <SelectItem key={domain.id} value={domain.id} className="rounded-lg">
                        {domain.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="difficulty" className="text-slate-700 font-bold">Difficulty</Label>
                <Select
                  value={formData.difficulty}
                  onValueChange={(val: any) => setFormData({ ...formData, difficulty: val })}
                >
                  <SelectTrigger id="difficulty" className="h-12 rounded-xl border-slate-100 bg-slate-50/50 focus:bg-white transition-all font-medium">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-slate-100 shadow-xl">
                    <SelectItem value="BEGINNER" className="rounded-lg">Beginner</SelectItem>
                    <SelectItem value="INTERMEDIATE" className="rounded-lg">Intermediate</SelectItem>
                    <SelectItem value="ADVANCED" className="rounded-lg">Advanced</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="price" className="text-slate-700 font-bold flex items-center gap-2">
                <IndianRupee className="h-4 w-4 text-indigo-500" />
                Price (INR)
              </Label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold group-focus-within:text-indigo-600">₹</span>
                <Input
                  id="price"
                  type="number"
                  placeholder="0.00"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                  className="pl-8 h-12 rounded-xl border-slate-100 bg-slate-50/50 focus:bg-white transition-all font-medium"
                />
              </div>
            </div>
          </div>

          <DialogFooter className="flex sm:justify-between items-center gap-4 pt-4 border-t border-slate-50">
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
              className="rounded-xl font-bold text-slate-500 hover:bg-slate-50"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold px-8 shadow-lg shadow-indigo-100 h-11 transition-all active:scale-95 disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create Course"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
