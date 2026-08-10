import { useState, useEffect } from "react";
import { Loader2, Sparkles } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/components/ui/dialog";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Textarea } from "@/shared/components/ui/textarea";
import { Label } from "@/shared/components/ui/label";
import { CourseModuleData, CreateModuleRequest, UpdateModuleRequest } from "../../types";

interface ModuleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: CreateModuleRequest | UpdateModuleRequest) => Promise<void>;
  module?: CourseModuleData | null;
  isLoading?: boolean;
}

export const ModuleDialog = ({
  open,
  onOpenChange,
  onSubmit,
  module,
  isLoading = false,
}: ModuleDialogProps) => {
  const isEditing = !!module;
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    domain: "",
  });
  const [errors, setErrors] = useState<{ title?: string }>({});

  useEffect(() => {
    if (module) {
      setFormData({
        title: module.title || "",
        description: module.description || "",
        domain: module.domain || "",
      });
    } else {
      setFormData({
        title: "",
        description: "",
        domain: "",
      });
    }
    setErrors({});
  }, [module, open]);

  const validateForm = () => {
    const newErrors: { title?: string } = {};
    if (!formData.title.trim()) {
      newErrors.title = "Title is required";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    const submitData: CreateModuleRequest | UpdateModuleRequest = {
      title: formData.title.trim(),
      description: formData.description.trim() || undefined,
      domain: formData.domain.trim() || undefined,
    };

    await onSubmit(submitData);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[520px] rounded-3xl border-slate-100 shadow-2xl bg-white/95 backdrop-blur-xl p-0 overflow-hidden">
        {/* Header with gradient accent */}
        <div className="bg-gradient-to-r from-brand-teal-500 via-brand-blue-500 to-pink-500 h-1.5" />
        
        <DialogHeader className="px-8 pt-8 pb-2">
          <div className="flex items-center gap-3 mb-2">
            <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-brand-teal-100 to-brand-blue-100 flex items-center justify-center shadow-sm">
              <Sparkles className="h-6 w-6 text-brand-teal-600" />
            </div>
            <div>
              <DialogTitle className="text-2xl font-extrabold text-slate-900 tracking-tight">
                {isEditing ? "Edit Module" : "Create New Module"}
              </DialogTitle>
              <DialogDescription className="text-slate-500 font-medium mt-0.5">
                {isEditing 
                  ? "Update the module details below" 
                  : "Add a new module to your course curriculum"}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="px-8 pb-8 space-y-6">
          <div className="space-y-5">
            {/* Title Field */}
            <div className="space-y-2">
              <Label 
                htmlFor="module-title" 
                className="text-sm font-bold text-slate-700 flex items-center gap-2"
              >
                Module Title
                <span className="text-rose-500">*</span>
              </Label>
              <Input
                id="module-title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="e.g., Introduction to Machine Learning"
                className={`h-12 rounded-xl bg-slate-50/50 border-slate-200 focus:ring-4 focus:ring-brand-teal-500/10 focus:border-brand-teal-500 focus:bg-white transition-all font-medium ${
                  errors.title ? "border-rose-300 focus:border-rose-500 focus:ring-rose-500/10" : ""
                }`}
                disabled={isLoading}
              />
              {errors.title && (
                <p className="text-sm text-rose-500 font-medium flex items-center gap-1.5">
                  <span className="h-1 w-1 rounded-full bg-rose-500" />
                  {errors.title}
                </p>
              )}
            </div>

            {/* Description Field */}
            <div className="space-y-2">
              <Label 
                htmlFor="module-description" 
                className="text-sm font-bold text-slate-700"
              >
                Description
              </Label>
              <Textarea
                id="module-description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Describe what students will learn in this module..."
                rows={4}
                className="rounded-xl bg-slate-50/50 border-slate-200 focus:ring-4 focus:ring-brand-teal-500/10 focus:border-brand-teal-500 focus:bg-white transition-all resize-none font-medium"
                disabled={isLoading}
              />
            </div>

            {/* Domain Field */}
            <div className="space-y-2">
              <Label 
                htmlFor="module-domain" 
                className="text-sm font-bold text-slate-700"
              >
                Domain / Topic Area
              </Label>
              <Input
                id="module-domain"
                value={formData.domain}
                onChange={(e) => setFormData({ ...formData, domain: e.target.value })}
                placeholder="e.g., Computer Science, Mathematics"
                className="h-12 rounded-xl bg-slate-50/50 border-slate-200 focus:ring-4 focus:ring-brand-teal-500/10 focus:border-brand-teal-500 focus:bg-white transition-all font-medium"
                disabled={isLoading}
              />
            </div>
          </div>

          <DialogFooter className="gap-3 pt-4 border-t border-slate-100">
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
              className="rounded-xl font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-50 px-6"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              className="bg-gradient-to-r from-brand-teal-600 to-brand-blue-600 hover:from-brand-teal-700 hover:to-brand-blue-700 text-white shadow-lg shadow-brand-teal-200 rounded-xl px-8 font-bold transition-all hover:-translate-y-0.5 disabled:opacity-70 disabled:hover:translate-y-0"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {isEditing ? "Saving..." : "Creating..."}
                </>
              ) : (
                <>
                  {isEditing ? "Save Changes" : "Create Module"}
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ModuleDialog;
