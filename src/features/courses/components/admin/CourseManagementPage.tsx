import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { 
  ChevronLeft, 
  Save, 
  Settings, 
  BookOpen, 
  Layout, 
  Plus, 
  GripVertical,
  Trash2,
  ExternalLink,
  Eye,
  AlertCircle,
  AlertTriangle,
  Loader2,
  Globe,
  Pencil,
  Upload
} from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Textarea } from "@/shared/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Badge } from "@/shared/components/ui/badge";
import { Label } from "@/shared/components/ui/label";
import { AdminNavbar } from "./AdminNavbar";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/shared/components/ui/select";
import { Switch } from "@/shared/components/ui/switch";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/shared/components/ui/alert-dialog";
import { coursesService } from "../../services/coursesService";
import { toast } from "@/shared/hooks/use-toast";
import { DifficultyType, CourseModuleData, CreateModuleRequest, UpdateModuleRequest, ContentItem, CreateContentRequest, UpdateContentRequest } from "../../types";
import { ModuleDialog } from "./ModuleDialog";
import { ModuleContentList } from "./ModuleContentList";
import { ContentDialog } from "./ContentDialog";
import { ContentPreviewDialog } from "./ContentPreviewDialog";

const CourseManagementPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isCreationMode = id === "new";
  const [activeTab, setActiveTab] = useState("general");
  const [isLoading, setIsLoading] = useState(!isCreationMode);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [domains, setDomains] = useState<{ id: string; name: string }[]>([]);
  
  // Thumbnail State
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadingImage, setUploadingImage] = useState(false);

  // Module Management State
  const [modules, setModules] = useState<CourseModuleData[]>([]);
  const [isModuleDialogOpen, setIsModuleDialogOpen] = useState(false);
  const [selectedModule, setSelectedModule] = useState<CourseModuleData | null>(null);
  const [isModuleLoading, setIsModuleLoading] = useState(false);
  const [moduleToDelete, setModuleToDelete] = useState<CourseModuleData | null>(null);

  // Content Management State
  const [activeModuleId, setActiveModuleId] = useState<string | null>(null);
  const [isContentDialogOpen, setIsContentDialogOpen] = useState(false);
  const [isPreviewDialogOpen, setIsPreviewDialogOpen] = useState(false);
  const [selectedContent, setSelectedContent] = useState<any | null>(null); // Type: ContentItem
  const [loadingModulesContent, setLoadingModulesContent] = useState<Set<string>>(new Set());
  const [moduleContentMap, setModuleContentMap] = useState<Record<string, any[]>>({}); // Map moduleId -> ContentItem[]
  const [isContentSaving, setIsContentSaving] = useState(false);
  const [contentToDelete, setContentToDelete] = useState<{moduleId: string, item: any} | null>(null);

  const [course, setCourse] = useState({
    id: isCreationMode ? "" : id,
    title: "",
    slug: "",
    description: "",
    difficulty: "BEGINNER" as DifficultyType,
    price: 0,
    domainId: "",
    is_published: false,
    duration_minutes: 0,
    thumbnail: null as string | null,
  });

  const fetchModules = async () => {
    if (isCreationMode || !id) return;
    try {
      const res = await coursesService.getCourseModules(id);
      setModules(res.data);
    } catch (err) {
      console.error("Failed to fetch modules", err);
      toast.error({ title: "Error", description: "Failed to load modules" });
    }
  };

  useEffect(() => {
    const loadData = async () => {
      try {
        const domainsData = await coursesService.getDomains();
        setDomains(domainsData);

        if (!isCreationMode && id) {
          const res = await coursesService.getCourseById(id);
          if (res.data) {
            setCourse({
              id: res.data.id || id,
              title: res.data.title || "",
              slug: res.data.slug || "",
              description: res.data.description || "",
              difficulty: (res.data.difficulty as DifficultyType) || "BEGINNER",
              price: res.data.price || 0,
              domainId: res.data.Domain?.id || "",
              is_published: res.data.is_published || false,
              duration_minutes: res.data.duration_minutes || 0,
              thumbnail: res.data.thumbnail || null,
            });
            // Initial modules load
            fetchModules();
          }
        }
      } catch (err) {
        toast.error({
          title: "Error",
          description: "Failed to load course details"
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [id, isCreationMode]);

  const handleSaveGeneral = async () => {
    if (!course.title || !course.domainId) {
      toast.warning({
        title: "Validation Error",
        description: "Title and Domain are required"
      });
      return;
    }

    if (course.duration_minutes <= 0) {
      toast.warning({
        title: "Validation Error",
        description: "Duration must be greater than 0 minutes"
      });
      return;
    }

    setIsSaving(true);
    try {
      if (isCreationMode) {
        const newCourse = await coursesService.createCourse({
          title: course.title,
          description: course.description,
          domainId: course.domainId,
          difficulty: course.difficulty,
          price: course.price,
          duration_minutes: course.duration_minutes
        });
        toast.success({ title: "Success", description: "Course created successfully" });
        navigate(`/courses/admin/manage/${newCourse.id}`, { replace: true });
      } else {
        await coursesService.updateCourse(course.id!, {
          title: course.title,
          description: course.description,
          difficulty: course.difficulty,
          price: course.price,
          is_published: course.is_published,
          domainId: course.domainId
        });
        toast.success({ title: "Saved", description: "Course details updated successfully" });
      }
    } catch (err) {
      toast.error({
        title: "Error",
        description: "Failed to save course"
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteCourse = async () => {
    if (!course.id) return;
    
    setIsDeleting(true);
    try {
      await coursesService.deleteCourse(course.id);
      toast.success({ title: "Deleted", description: "Course has been permanently deleted" });
      navigate("/courses/admin/dashboard", { replace: true });
    } catch (err) {
      toast.error({
        title: "Error",
        description: "Failed to delete course"
      });
    } finally {
      setIsDeleting(false);
      setShowDeleteDialog(false);
    }
  };

  // Module Handlers
  const handleAddModule = () => {
    setSelectedModule(null);
    setIsModuleDialogOpen(true);
  };

  const handleEditModule = (module: CourseModuleData) => {
    setSelectedModule(module);
    setIsModuleDialogOpen(true);
  };

  const handleModuleSubmit = async (data: CreateModuleRequest | UpdateModuleRequest) => {
    if (!id) return;
    
    setIsModuleLoading(true);
    try {
      if (selectedModule) {
        // Update existing module
        await coursesService.updateCourseModule(id, selectedModule.id, data as UpdateModuleRequest);
        toast.success({ title: "Success", description: "Module updated successfully" });
      } else {
        // Create new module
        await coursesService.addCourseModule(id, data as CreateModuleRequest);
        toast.success({ title: "Success", description: "Module created successfully" });
      }
      setIsModuleDialogOpen(false);
      fetchModules(); // Refresh list
    } catch (error) {
      console.error("Module save error:", error);
      toast.error({ 
        title: "Error", 
        description: selectedModule ? "Failed to update module" : "Failed to create module" 
      });
    } finally {
      setIsModuleLoading(false);
    }
  };

  const handleDeleteModule = async () => {
    if (!id || !moduleToDelete) return;
1
    setIsModuleLoading(true);
    try {
      // By default, we'll just unlink from course (deleteModule=false), 
      // but if you want to hard delete content, you can pass true or ask user.
      // For now, let's just use the API default which unlinks.
      await coursesService.deleteCourseModule(id, moduleToDelete.id, true); 
      toast.success({ title: "Deleted", description: "Module removed successfully" });
      setModuleToDelete(null);
      fetchModules();
    } catch (error) {
      console.error("Module delete error:", error);
      toast.error({ title: "Error", description: "Failed to delete module" });
    } finally {
      setIsModuleLoading(false);
    }
  };

  const handleThumbnailUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !course.id) return;

    if (file.size > 2 * 1024 * 1024) {
      toast.error({ title: "Error", description: "Image must be less than 2MB" });
      return;
    }

    setUploadingImage(true);
    try {
      const res = await coursesService.uploadCourseThumbnail(course.id, file);
      setCourse(prev => ({ ...prev, thumbnail: res.thumbnail }));
      toast.success({ title: "Success", description: "Thumbnail updated" });
    } catch (error) {
       toast.error({ title: "Error", description: "Failed to upload thumbnail" });
    } finally {
      setUploadingImage(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleThumbnailRemove = async () => {
    if (!course.id) return;

    setUploadingImage(true);
    try {
      await coursesService.removeCourseThumbnail(course.id);
      setCourse(prev => ({ ...prev, thumbnail: null }));
      toast.success({ title: "Success", description: "Thumbnail removed" });
    } catch (error) {
      toast.error({ title: "Error", description: "Failed to remove thumbnail" });
    } finally {
      setUploadingImage(false);
    }
  };

  // Content Handlers
  const fetchModuleContent = async (moduleId: string) => {
    if (!id) return;
    setLoadingModulesContent(prev => new Set(prev).add(moduleId));
    try {
      const res = await coursesService.getInstructorModuleContent(id, moduleId);
      setModuleContentMap(prev => ({
        ...prev,
        [moduleId]: res.data?.contentItems || []
      }));
    } catch (error) {
      console.error("Failed to fetch content for module", moduleId, error);
      toast.error({ title: "Error", description: "Failed to load module content" });
    } finally {
      setLoadingModulesContent(prev => {
        const next = new Set(prev);
        next.delete(moduleId);
        return next;
      });
    }
  };

  useEffect(() => {
    // Determine which modules need content loaded
    if (modules.length > 0) {
       modules.forEach(m => fetchModuleContent(m.id));
    }
  }, [modules]);

  const handleAddContent = (moduleId: string) => {
    setActiveModuleId(moduleId);
    setSelectedContent(null);
    setIsContentDialogOpen(true);
  };

  const handlePreviewContent = (item: any) => {
    setSelectedContent(item);
    setIsPreviewDialogOpen(true);
  };

  const handleEditContent = (moduleId: string, item: any) => {
    setActiveModuleId(moduleId);
    setSelectedContent(item);
    setIsContentDialogOpen(true);
  };

  const handleContentSubmit = async (data: CreateContentRequest | UpdateContentRequest) => {
    if (!id || !activeModuleId) return;

    setIsContentSaving(true);
    try {
      if (selectedContent && !isPreviewDialogOpen) {
        // Update (ensure we are not in preview mode if reusing selectedContent, 
        // though handlePreviewContent sets isPreviewDialogOpen)
        // Actually selectedContent is shared. 
        // If isPreviewDialogOpen is true, we probably shouldn't be here, but just in case.
        
        await coursesService.updateModuleContent(
          id, 
          activeModuleId, 
          selectedContent.id, 
          data as UpdateContentRequest
        );
        toast.success({ title: "Success", description: "Content updated successfully" });
      } else {
        // Create
        await coursesService.addModuleContent(
          id, 
          activeModuleId, 
          data as CreateContentRequest
        );
        toast.success({ title: "Success", description: "Content added successfully" });
      }
      setIsContentDialogOpen(false);
      fetchModuleContent(activeModuleId); // Refresh content for this module
    } catch (error) {
      console.error("Content save error:", error);
      toast.error({ 
        title: "Error", 
        description: "Failed to save content" 
      });
    } finally {
      setIsContentSaving(false);
    }
  };

  const handleDeleteContent = async (moduleId: string, item: any) => {
      setContentToDelete({ moduleId, item });
  };

  const confirmDeleteContent = async () => {
    if (!id || !contentToDelete) return;

    setIsContentSaving(true);
    try {
      await coursesService.deleteModuleContent(id, contentToDelete.moduleId, contentToDelete.item.id);
      toast.success({ title: "Deleted", description: "Content deleted successfully" });
      fetchModuleContent(contentToDelete.moduleId);
    } catch (error) {
       console.error("Content delete error:", error);
       toast.error({ title: "Error", description: "Failed to delete content" });
    } finally {
      setIsContentSaving(false);
      setContentToDelete(null);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f8fafc]">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 rounded-full border-t-2 border-b-2 border-indigo-600 animate-spin"></div>
          <p className="text-slate-500 font-medium">Loading course data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8fafc]">
      <AdminNavbar />

      <ModuleDialog 
        open={isModuleDialogOpen}
        onOpenChange={setIsModuleDialogOpen}
        onSubmit={handleModuleSubmit}
        module={selectedModule}
        isLoading={isModuleLoading}
      />

      {/* Delete Course Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent className="rounded-3xl border-slate-100 shadow-2xl">
          <AlertDialogHeader>
            <div className="h-12 w-12 rounded-2xl bg-rose-50 flex items-center justify-center mb-4">
              <AlertTriangle className="h-6 w-6 text-rose-500" />
            </div>
            <AlertDialogTitle className="text-xl font-bold text-slate-900">Delete this course?</AlertDialogTitle>
            <AlertDialogDescription className="text-slate-500">
              This will permanently delete <span className="font-bold text-slate-900">"{course.title}"</span> and all its content, modules, student enrollments, and progress data. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-6">
            <AlertDialogCancel className="rounded-xl font-bold border-slate-100 hover:bg-slate-50" disabled={isDeleting}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteCourse}
              disabled={isDeleting}
              className="rounded-xl font-bold bg-rose-500 hover:bg-rose-600 text-white shadow-lg shadow-rose-200"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete Course"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Module Confirmation Dialog */}
      <AlertDialog open={!!moduleToDelete} onOpenChange={(open) => !open && setModuleToDelete(null)}>
        <AlertDialogContent className="rounded-3xl border-slate-100 shadow-2xl">
          <AlertDialogHeader>
            <div className="h-12 w-12 rounded-2xl bg-rose-50 flex items-center justify-center mb-4">
              <Trash2 className="h-6 w-6 text-rose-500" />
            </div>
            <AlertDialogTitle className="text-xl font-bold text-slate-900">Delete Module?</AlertDialogTitle>
            <AlertDialogDescription className="text-slate-500">
              Are you sure you want to delete <span className="font-bold text-slate-900">"{moduleToDelete?.title}"</span>? This will remove it from the course curriculum.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-6">
            <AlertDialogCancel className="rounded-xl font-bold border-slate-100 hover:bg-slate-50" disabled={isModuleLoading}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteModule}
              disabled={isModuleLoading}
              className="rounded-xl font-bold bg-rose-500 hover:bg-rose-600 text-white shadow-lg shadow-rose-200"
            >
              {isModuleLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete Module"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      <ContentDialog 
        open={isContentDialogOpen}
        onOpenChange={setIsContentDialogOpen}
        onSubmit={handleContentSubmit}
        content={selectedContent}
        isLoading={isContentSaving}
      />

      <ContentPreviewDialog
        open={isPreviewDialogOpen}
        onOpenChange={setIsPreviewDialogOpen}
        content={selectedContent}
      />

      {/* Delete Content Confirmation Dialog */}
      <AlertDialog open={!!contentToDelete} onOpenChange={(open) => !open && setContentToDelete(null)}>
        <AlertDialogContent className="rounded-3xl border-slate-100 shadow-2xl">
          <AlertDialogHeader>
            <div className="h-12 w-12 rounded-2xl bg-rose-50 flex items-center justify-center mb-4">
              <Trash2 className="h-6 w-6 text-rose-500" />
            </div>
            <AlertDialogTitle className="text-xl font-bold text-slate-900">Delete Content?</AlertDialogTitle>
            <AlertDialogDescription className="text-slate-500">
              Are you sure you want to delete <span className="font-bold text-slate-900">"{contentToDelete?.item.title}"</span>? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-6">
            <AlertDialogCancel className="rounded-xl font-bold border-slate-100 hover:bg-slate-50" disabled={isContentSaving}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDeleteContent}
              disabled={isContentSaving}
              className="rounded-xl font-bold bg-rose-500 hover:bg-rose-600 text-white shadow-lg shadow-rose-200"
            >
              {isContentSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete Content"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <Button 
              variant="ghost" 
              className="pl-0 text-slate-500 hover:text-indigo-600 font-medium transition-colors"
                onClick={() => navigate("/courses/admin/dashboard")}
            >
              <ChevronLeft className="mr-1 h-4 w-4" /> Back to Dashboard
            </Button>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
                {isCreationMode ? "Create New Course" : "Manage Course"}
              </h1>
              <Badge variant="outline" className={`font-bold px-3 py-1 rounded-full uppercase text-[10px] tracking-wider ${
                course.is_published 
                  ? "bg-emerald-50 text-emerald-600 border-emerald-200" 
                  : "bg-amber-50 text-amber-600 border-amber-200"
              }`}>
                {course.is_published ? "Published" : "Draft"}
              </Badge>
            </div>
            {!isCreationMode && (
                <p className="text-slate-500 font-medium">
                    ID: <span className="text-slate-400 font-mono">{course.id}</span>
                </p>
            )}
          </div>
          
          <div className="flex items-center gap-3">
            {!isCreationMode && (
                <Button 
                    variant="outline" 
                    className="rounded-xl font-bold border-slate-200 hover:bg-white hover:text-indigo-600 transition-all"
                    onClick={() => navigate(`/courses/${course.slug}`, { state: { courseId: course.id } })}
                >
                  <Eye className="mr-2 h-4 w-4" /> Preview
                </Button>
            )}
          </div>
        </div>

        {/* content section */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="bg-white/50 backdrop-blur-sm border border-slate-100 p-1.5 rounded-2xl h-14 w-full flex justify-start gap-2 max-w-2xl overflow-x-auto shadow-sm">
            <TabsTrigger 
              value="general" 
              className="rounded-xl px-6 font-bold data-[state=active]:bg-white data-[state=active]:text-indigo-600 data-[state=active]:shadow-md transition-all h-full"
            >
              <Layout className="mr-2 h-4 w-4" /> General Details
            </TabsTrigger>
            <TabsTrigger 
              value="curriculum" 
              className="rounded-xl px-6 font-bold data-[state=active]:bg-white data-[state=active]:text-indigo-600 data-[state=active]:shadow-md transition-all h-full"
              disabled={isCreationMode}
            >
              <BookOpen className="mr-2 h-4 w-4" /> Curriculum
            </TabsTrigger>
            <TabsTrigger 
              value="settings" 
              className="rounded-xl px-6 font-bold data-[state=active]:bg-white data-[state=active]:text-indigo-600 data-[state=active]:shadow-md transition-all h-full"
              disabled={isCreationMode}
            >
              <Settings className="mr-2 h-4 w-4" /> Advanced Settings
            </TabsTrigger>
          </TabsList>

          <TabsContent value="general" className="mt-0 space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <Card className="lg:col-span-2 rounded-3xl border-slate-100 shadow-sm overflow-hidden bg-white/50 backdrop-blur-xl">
                <CardHeader className="border-b border-slate-50 bg-white/50">
                  <CardTitle className="text-xl font-bold">Course Information</CardTitle>
                  <CardDescription>Basic details about your course that students will see.</CardDescription>
                </CardHeader>
                <CardContent className="p-8 space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="title" className="text-sm font-bold text-slate-700">Course Title</Label>
                    <Input 
                        id="title" 
                        value={course.title} 
                        onChange={(e) => setCourse({...course, title: e.target.value})}
                        className="h-12 rounded-xl bg-white border-slate-100 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="description" className="text-sm font-bold text-slate-700">Course Description</Label>
                    <Textarea 
                        id="description" 
                        value={course.description} 
                        rows={6}
                        onChange={(e) => setCourse({...course, description: e.target.value})}
                        className="rounded-xl bg-white border-slate-100 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all resize-none"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="difficulty" className="text-sm font-bold text-slate-700">Difficulty Level</Label>
                      <Select 
                        value={course.difficulty} 
                        onValueChange={(val: any) => setCourse({...course, difficulty: val})}
                      >
                        <SelectTrigger className="h-12 rounded-xl bg-white border-slate-100 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all">
                          <SelectValue placeholder="Select level" />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl border-slate-100 shadow-xl p-1">
                          <SelectItem value="BEGINNER" className="rounded-lg font-medium">Beginner</SelectItem>
                          <SelectItem value="INTERMEDIATE" className="rounded-lg font-medium">Intermediate</SelectItem>
                          <SelectItem value="ADVANCED" className="rounded-lg font-medium">Advanced</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="domain" className="text-sm font-bold text-slate-700">Domain</Label>
                        <Select 
                            value={course.domainId} 
                            onValueChange={(val) => setCourse({...course, domainId: val})}
                        >
                            <SelectTrigger className="h-12 rounded-xl bg-white border-slate-100 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all">
                                <SelectValue placeholder="Select domain" />
                            </SelectTrigger>
                            <SelectContent className="rounded-xl border-slate-100 shadow-xl p-1">
                                {domains.map((domain) => (
                                    <SelectItem key={domain.id} value={domain.id} className="rounded-lg font-medium">
                                        {domain.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="duration" className="text-sm font-bold text-slate-700">Duration (Minutes)</Label>
                      <Input 
                        id="duration" 
                        type="number" 
                        min="0"
                        value={course.duration_minutes === 0 ? '' : course.duration_minutes} 
                        onChange={(e) => setCourse({...course, duration_minutes: e.target.value === '' ? 0 : parseInt(e.target.value) || 0})}
                        className="h-12 rounded-xl bg-white border-slate-100 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all"
                      />
                    </div>
                    
                    <div className="space-y-2">
                       <Label htmlFor="price" className="text-sm font-bold text-slate-700">Price (INR)</Label>
                       <div className="relative">
                         <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">₹</span>
                         <Input 
                             id="price" 
                             type="number" 
                             min="0"
                             value={course.price === 0 ? '' : course.price} 
                             onChange={(e) => setCourse({...course, price: e.target.value === '' ? 0 : parseFloat(e.target.value) || 0})}
                             className="pl-8 h-12 rounded-xl bg-white border-slate-100 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all"
                         />
                       </div>
                    </div>
                  </div>

                  {/* Publish Toggle in General Tab */}
                  {!isCreationMode && (
                    <div className="flex items-center justify-between p-5 rounded-2xl bg-gradient-to-r from-indigo-50/50 to-purple-50/50 border border-indigo-100/50">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-indigo-100 flex items-center justify-center">
                          <Globe className="h-5 w-5 text-indigo-600" />
                        </div>
                        <div className="space-y-0.5">
                          <h4 className="font-bold text-slate-900">Course Visibility</h4>
                          <p className="text-sm text-slate-500">Make visible on the marketplace</p>
                        </div>
                      </div>
                      <Switch 
                        checked={course.is_published} 
                        onCheckedChange={(checked) => setCourse({...course, is_published: checked})}
                      />
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="rounded-3xl border-slate-100 shadow-sm overflow-hidden bg-white/50 backdrop-blur-xl h-fit">
                <CardHeader className="border-b border-slate-50 bg-white/50">
                  <CardTitle className="text-xl font-bold">Course Image</CardTitle>
                </CardHeader>
                <CardContent className="p-6 space-y-4">
                  <div className="aspect-video rounded-2xl overflow-hidden bg-slate-100 border-2 border-dashed border-slate-200 group relative flex items-center justify-center">
                    {uploadingImage ? (
                      <div className="flex flex-col items-center gap-2 text-indigo-600">
                        <Loader2 className="h-6 w-6 animate-spin" />
                        <span className="text-sm font-medium">Uploading...</span>
                      </div>
                    ) : course.thumbnail ? (
                      <>
                        <img 
                            src={course.thumbnail} 
                            alt="Preview" 
                            className="w-full h-full object-cover transition-opacity group-hover:opacity-50"
                        />
                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity gap-2">
                             <Button 
                                variant="secondary" 
                                size="sm" 
                                className="rounded-xl font-bold bg-white text-indigo-600 shadow-xl"
                                onClick={() => fileInputRef.current?.click()}
                            >
                                Change
                            </Button>
                            <Button 
                                variant="destructive" 
                                size="sm" 
                                className="rounded-xl font-bold shadow-xl"
                                onClick={handleThumbnailRemove}
                            >
                                Remove
                            </Button>
                        </div>
                      </>
                    ) : (
                      <div className="text-center p-6 space-y-2 group-hover:opacity-100">
                        <div className="h-12 w-12 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-2">
                          <Upload className="h-6 w-6" />
                        </div>
                         <Button 
                              variant="ghost" 
                              className="text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 font-bold"
                              onClick={() => fileInputRef.current?.click()}
                          >
                            Upload Image
                          </Button>
                      </div>
                    )}
                    
                    <input 
                      type="file" 
                      ref={fileInputRef}
                      className="hidden"
                      accept="image/*"
                      onChange={handleThumbnailUpload}
                      disabled={isCreationMode || uploadingImage} 
                    />
                  </div>
                  <p className="text-xs text-slate-400 text-center font-medium">
                     {isCreationMode ? "Save the course first to upload an image." : "Recommended: 1280x720px. Max: 2MB."}
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Save Button for General Tab */}
            <div className="flex justify-end">
              <Button 
                  className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-100 rounded-xl px-8 font-bold transition-all hover:-translate-y-0.5"
                  onClick={handleSaveGeneral}
                  disabled={isSaving}
              >
                {isSaving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    {isCreationMode ? "Create Course" : "Save Changes"}
                  </>
                )}
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="curriculum" className="mt-0">
             <Card className="rounded-3xl border-slate-100 shadow-sm overflow-hidden bg-white/50 backdrop-blur-xl">
                <CardHeader className="border-b border-slate-50 bg-white/50 flex flex-row items-center justify-between space-y-0">
                  <div>
                    <CardTitle className="text-xl font-bold">Course Structure</CardTitle>
                    <CardDescription>Manage your course modules and content.</CardDescription>
                  </div>
                  <Button 
                    className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-md rounded-xl font-bold"
                    onClick={handleAddModule}
                  >
                    <Plus className="mr-2 h-4 w-4" /> Add Module
                  </Button>
                </CardHeader>
                <CardContent className="p-8 space-y-4">
                  {modules.length > 0 ? (
                    <div className="space-y-4">
                      {modules.map((module) => (
                        <Card key={module.id} className="border border-slate-100 shadow-sm hover:shadow-md transition-all overflow-hidden group">
                           {/* Module Header */}
                           <div className="flex items-center gap-4 bg-white p-5 border-b border-slate-50">
                             <GripVertical className="h-5 w-5 text-slate-300 cursor-grab active:cursor-grabbing hover:text-indigo-400 transition-colors" />
                             <div className="flex-grow">
                               <h4 className="font-bold text-slate-800 text-lg">
                                   {module.order_index !== -1 ? `Module ${module.order_index}: ` : ''}{module.title}
                               </h4>
                               <div className="flex items-center gap-3 mt-1.5">
                                   <Badge variant="secondary" className="bg-slate-50 text-slate-500 hover:bg-slate-100 border-none font-medium">
                                       {module.domain || "No domain"}
                                   </Badge>
                                   <span className="text-xs text-slate-400 font-medium flex items-center gap-1">
                                       <BookOpen className="h-3 w-3" />
                                       {module.conceptCount || 0} lessons
                                   </span>
                               </div>
                             </div>
                             <div className="flex items-center gap-2">
                               <Button 
                                   variant="ghost" 
                                   className="text-indigo-600 bg-indigo-50 hover:bg-indigo-100 font-bold rounded-xl h-9 text-xs"
                                   onClick={() => handleAddContent(module.id)}
                               >
                                 <Plus className="mr-1.5 h-3.5 w-3.5" /> Add Content
                               </Button>
                               <div className="h-6 w-px bg-slate-100 mx-1"></div>
                               <Button 
                                   variant="ghost" 
                                   size="icon" 
                                   className="h-9 w-9 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl"
                                   onClick={() => handleEditModule(module)}
                               >
                                 <Pencil className="h-4 w-4" />
                               </Button>
                               <Button 
                                   variant="ghost" 
                                   size="icon" 
                                   className="h-9 w-9 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl"
                                   onClick={() => setModuleToDelete(module)}
                               >
                                 <Trash2 className="h-4 w-4" />
                               </Button>
                             </div>
                           </div>

                           {/* Module Content List */}
                           <div className="bg-slate-50/50 p-4">
                             <ModuleContentList 
                               contentItems={moduleContentMap[module.id] || []}
                               onEdit={(item) => handleEditContent(module.id, item)}
                               onDelete={(item) => handleDeleteContent(module.id, item)}
                               onPreview={handlePreviewContent}
                               isLoading={loadingModulesContent.has(module.id)}
                             />
                           </div>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12 space-y-4">
                       <div className="h-16 w-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto">
                         <BookOpen className="h-8 w-8 text-slate-200" />
                       </div>
                       <div>
                         <h3 className="text-lg font-bold text-slate-800">No modules yet</h3>
                         <p className="text-slate-500 font-medium mt-1">Start building your course curriculum by adding your first module.</p>
                       </div>
                       <Button 
                        variant="outline" 
                        className="rounded-xl border-slate-200 font-bold hover:text-indigo-600 group"
                        onClick={handleAddModule}
                       >
                         <Plus className="mr-2 h-4 w-4 group-hover:scale-110 transition-transform" /> Create First Module
                       </Button>
                    </div>
                  )}
                </CardContent>
             </Card>
          </TabsContent>

          <TabsContent value="settings" className="mt-0 space-y-8">
            <Card className="rounded-3xl border-slate-100 shadow-sm overflow-hidden bg-white/50 backdrop-blur-xl">
              <CardHeader className="border-b border-slate-50 bg-white/50">
                <CardTitle className="text-xl font-bold">Visibility Settings</CardTitle>
                <CardDescription>Control who can see and enroll in your course.</CardDescription>
              </CardHeader>
              <CardContent className="p-8 space-y-8">
                <div className="flex items-center justify-between p-6 rounded-2xl bg-indigo-50/30 border border-indigo-100/50">
                  <div className="space-y-1">
                    <h4 className="font-bold text-slate-900">Publish Course</h4>
                    <p className="text-sm text-slate-500 font-medium">Make this course visible to students on the marketplace.</p>
                  </div>
                  <Switch 
                    checked={course.is_published} 
                    onCheckedChange={(checked) => setCourse({...course, is_published: checked})}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-4 text-slate-600">
                    <h4 className="font-bold text-slate-900 flex items-center">
                      <AlertCircle className="mr-2 h-4 w-4 text-indigo-500" /> 
                      Things to keep in mind
                    </h4>
                    <ul className="space-y-3 text-sm font-medium">
                      <li className="flex items-start gap-3">
                        <div className="h-1.5 w-1.5 rounded-full bg-indigo-500 mt-1.5 flex-shrink-0" />
                        Once published, you should avoid breaking changes to the curriculum.
                      </li>
                      <li className="flex items-start gap-3">
                        <div className="h-1.5 w-1.5 rounded-full bg-indigo-500 mt-1.5 flex-shrink-0" />
                        Students who enrolled while it was free will keep access if you change the price.
                      </li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-3xl border-rose-100 shadow-sm shadow-rose-100/20 overflow-hidden bg-rose-50/20 backdrop-blur-xl">
              <CardHeader className="border-b border-rose-100 bg-rose-50/50">
                <CardTitle className="text-xl font-bold text-rose-900">Danger Zone</CardTitle>
                <CardDescription className="text-rose-600">Irreversible actions for your course.</CardDescription>
              </CardHeader>
              <CardContent className="p-8">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-6 p-6 rounded-2xl bg-white border border-rose-100">
                  <div className="space-y-1">
                    <h4 className="font-bold text-slate-900">Delete this course</h4>
                    <p className="text-sm text-slate-500 font-medium">All content, student progress, and data will be permanently removed.</p>
                  </div>
                  <Button 
                    variant="destructive" 
                    className="rounded-xl font-bold shadow-lg shadow-rose-200 min-w-[140px]"
                    onClick={() => setShowDeleteDialog(true)}
                    disabled={isCreationMode}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete Course
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default CourseManagementPage;
