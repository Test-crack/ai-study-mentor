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
import { Textarea } from "@/shared/components/ui/textarea";
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
import { 
    Loader2, 
    Sparkles, 
    BookOpen, 
    GraduationCap, 
    IndianRupee, 
    Clock, 
    Plus, 
    ChevronLeft,
    FileText 
} from "lucide-react";

interface CreateCourseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateCourseDialog({ open, onOpenChange }: CreateCourseDialogProps) {
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAddingDomain, setIsAddingDomain] = useState(false);
  const [isCreatingDomain, setIsCreatingDomain] = useState(false);
  const [domains, setDomains] = useState<{ id: string; name: string }[]>([]);
  
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    domainId: "",
    difficulty: DifficultyType.BEGINNER,
    price: 0,
    duration_minutes: 0
  });

  const [newDomain, setNewDomain] = useState({
    name: "",
    description: ""
  });

  const fetchDomains = async () => {
    try {
      const data = await coursesService.getDomains();
      setDomains(data);
    } catch (error) {
      console.error("Failed to fetch domains", error);
    }
  };

  useEffect(() => {
    if (open) {
      fetchDomains();
    }
  }, [open]);

  const handleCreateDomain = async () => {
    if (!newDomain.name) {
      toast.error({
        title: "Error",
        description: "Domain name is required"
      });
      return;
    }

    setIsCreatingDomain(true);
    try {
      const createdDomain = await coursesService.createDomain(newDomain);
      toast.success({
        title: "Success",
        description: `Domain "${newDomain.name}" created successfully.`,
      });
      
      // Refresh domains and select the new one
      await fetchDomains();
      setFormData({ ...formData, domainId: createdDomain.id });
      setIsAddingDomain(false);
      setNewDomain({ name: "", description: "" });
    } catch (error) {
      toast.error({
        title: "Error",
        description: "Failed to create domain. It might already exist."
      });
    } finally {
      setIsCreatingDomain(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.domainId) {
      toast.warning({
        title: "Validation Error",
        description: "Please fill in all required fields (Title and Domain)."
      });
      return;
    }

    if (formData.duration_minutes <= 0) {
      toast.warning({
        title: "Validation Error",
        description: "Duration must be greater than 0 minutes."
      });
      return;
    }

    setIsSubmitting(true);
    try {
      // Align with backend: Name or title is accepted
      await coursesService.createCourse({
        title: formData.title,
        description: formData.description,
        domainId: formData.domainId,
        difficulty: formData.difficulty,
        price: formData.price,
        duration_minutes: formData.duration_minutes
      });
      
      toast.success({
        title: "Course Created!",
        description: `${formData.title} has been added to your courses.`,
      });
      
      queryClient.invalidateQueries({ queryKey: ["instructor-courses"] });
      onOpenChange(false);
      resetForm();
    } catch (error) {
      toast.error({
        title: "Error",
        description: "Failed to create course. Please try again."
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({
        title: "",
        description: "",
        domainId: "",
        difficulty: DifficultyType.BEGINNER,
        price: 0,
        duration_minutes: 0
    });
    setIsAddingDomain(false);
  };

  return (
    <Dialog open={open} onOpenChange={(val) => {
        if (!val) resetForm();
        onOpenChange(val);
    }}>
      <DialogContent className="sm:max-w-[600px] border-slate-100 rounded-3xl p-0 overflow-hidden bg-white max-h-[90vh] overflow-y-auto">
        <div className="bg-brand-teal-600 p-8 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 -tr-y-1/2 translate-x-1/4 opacity-10">
              <Sparkles className="h-48 w-48" />
          </div>
          <DialogHeader className="relative z-10">
            <DialogTitle className="text-2xl font-extrabold flex items-center gap-3">
              <BookOpen className="h-6 w-6 text-brand-teal-200" />
              {isAddingDomain ? "Add New Domain" : "Create New Course"}
            </DialogTitle>
            <DialogDescription className="text-brand-teal-100 font-medium">
              {isAddingDomain 
                ? "Organize your courses by creating a new specialized domain." 
                : "Start building your next educational masterpiece."}
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="p-8">
            {isAddingDomain ? (
                <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="domainName" className="text-slate-700 font-bold">Domain Name *</Label>
                            <Input
                                id="domainName"
                                placeholder="e.g. Computer Science"
                                value={newDomain.name}
                                onChange={(e) => setNewDomain({ ...newDomain, name: e.target.value })}
                                className="h-12 rounded-xl border-slate-100 bg-slate-50/50 focus:bg-white transition-all font-medium"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="domainDesc" className="text-slate-700 font-bold">Description (Optional)</Label>
                            <Textarea
                                id="domainDesc"
                                placeholder="Briefly describe what this domain covers..."
                                value={newDomain.description}
                                onChange={(e) => setNewDomain({ ...newDomain, description: e.target.value })}
                                className="rounded-xl border-slate-100 bg-slate-50/50 focus:bg-white transition-all font-medium resize-none"
                                rows={3}
                            />
                        </div>
                    </div>
                    <div className="flex gap-3 pt-4 border-t border-slate-50">
                        <Button
                            type="button"
                            variant="ghost"
                            onClick={() => setIsAddingDomain(false)}
                            className="rounded-xl font-bold text-slate-500 hover:bg-slate-50"
                        >
                            <ChevronLeft className="mr-2 h-4 w-4" /> Back
                        </Button>
                        <Button
                            onClick={handleCreateDomain}
                            disabled={isCreatingDomain}
                            className="flex-grow bg-brand-teal-600 hover:bg-brand-teal-700 text-white rounded-xl font-bold shadow-lg h-11 transition-all"
                        >
                            {isCreatingDomain ? <Loader2 className="animate-spin" /> : "Create Domain"}
                        </Button>
                    </div>
                </div>
            ) : (
                <form onSubmit={handleSubmit} className="space-y-6 animate-in fade-in slide-in-from-left-4 duration-300">
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="title" className="text-slate-700 font-bold flex items-center gap-2">
                                Course Title / Name
                                <span className="text-rose-500">*</span>
                            </Label>
                            <Input
                                id="title"
                                placeholder="e.g. Master Advanced Frontend Architecture"
                                value={formData.title}
                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                className="h-12 rounded-xl border-slate-100 bg-slate-50/50 focus:bg-white focus:ring-4 focus:ring-brand-teal-500/10 transition-all font-medium"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="description" className="text-slate-700 font-bold flex items-center gap-2">
                                <FileText className="h-4 w-4 text-brand-teal-500" />
                                Description
                            </Label>
                            <Textarea
                                id="description"
                                placeholder="Give students a reason to enroll..."
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                className="rounded-xl border-slate-100 bg-slate-50/50 focus:bg-white transition-all font-medium resize-none"
                                rows={3}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <div className="flex items-center justify-between mb-2">
                                    <Label htmlFor="domain" className="text-slate-700 font-bold flex items-center gap-2">
                                        <GraduationCap className="h-4 w-4 text-brand-teal-500" />
                                        Domain *
                                    </Label>
                                    <button 
                                        type="button"
                                        onClick={() => setIsAddingDomain(true)}
                                        className="text-[10px] font-bold text-brand-teal-600 hover:text-brand-teal-700 flex items-center gap-1 uppercase tracking-wider"
                                    >
                                        <Plus className="h-3 w-3" /> New
                                    </button>
                                </div>
                                <Select
                                    value={formData.domainId}
                                    onValueChange={(val) => setFormData({ ...formData, domainId: val })}
                                >
                                    <SelectTrigger id="domain" className="h-12 rounded-xl border-slate-100 bg-slate-50/50 focus:bg-white transition-all font-medium">
                                        <SelectValue placeholder="Select Domain" />
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
                                <Label htmlFor="difficulty" className="text-slate-700 font-bold mt-2.5 block">Difficulty</Label>
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

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="duration" className="text-slate-700 font-bold flex items-center gap-2">
                                    <Clock className="h-4 w-4 text-brand-teal-500" />
                                    Duration (min)
                                </Label>
                                <Input
                                    id="duration"
                                    type="number"
                                    min="0"
                                    placeholder="0"
                                    value={formData.duration_minutes === 0 ? '' : formData.duration_minutes}
                                    onChange={(e) => setFormData({ ...formData, duration_minutes: e.target.value === '' ? 0 : parseInt(e.target.value) || 0 })}
                                    className="h-12 rounded-xl border-slate-100 bg-slate-50/50 focus:bg-white transition-all font-medium"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="price" className="text-slate-700 font-bold flex items-center gap-2">
                                    <IndianRupee className="h-4 w-4 text-brand-teal-500" />
                                    Price (INR)
                                </Label>
                                <div className="relative">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold group-focus-within:text-brand-teal-600">₹</span>
                                    <Input
                                        id="price"
                                        type="number"
                                        min="0"
                                        placeholder="0"
                                        value={formData.price === 0 ? '' : formData.price}
                                        onChange={(e) => setFormData({ ...formData, price: e.target.value === '' ? 0 : parseFloat(e.target.value) || 0 })}
                                        className="pl-8 h-12 rounded-xl border-slate-100 bg-slate-50/50 focus:bg-white transition-all font-medium"
                                    />
                                </div>
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
                            className="bg-brand-teal-600 hover:bg-brand-teal-700 text-white rounded-xl font-bold px-8 shadow-lg shadow-brand-teal-100 h-11 transition-all active:scale-95 disabled:opacity-50"
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
            )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
