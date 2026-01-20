import { useState, useEffect } from "react";
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
  AlertCircle
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
import { coursesService } from "../../services/coursesService";
import { toast } from "@/shared/hooks/use-toast";
import { DifficultyType } from "../../types";

const CourseManagementPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isCreationMode = id === "new";
  const [activeTab, setActiveTab] = useState("general");
  const [isLoading, setIsLoading] = useState(!isCreationMode);
  const [isSaving, setIsSaving] = useState(false);
  const [domains, setDomains] = useState<{ id: string; name: string }[]>([]);

  // Mock course data for UI development
  const [course, setCourse] = useState({
    id: isCreationMode ? "" : id,
    title: "",
    slug: "",
    description: "",
    difficulty: "BEGINNER" as DifficultyType,
    price: 0,
    domainId: "",
    is_published: false,
    thumbnail: "https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=800&auto=format&fit=crop&q=60",
    modules: [] as any[]
  });

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
              thumbnail: "https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=800&auto=format&fit=crop&q=60",
              modules: res.data.modules || []
            });
          }
        }
      } catch (err) {
        toast({
          title: "Error",
          description: "Failed to load course details",
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [id, isCreationMode]);

  const handleSave = async () => {
    if (!course.title || !course.domainId) {
      toast({
        title: "Validation Error",
        description: "Title and Domain are required",
        variant: "destructive"
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
        });
        toast({ title: "Success", description: "Course created successfully" });
        navigate(`/courses/admin/manage/${newCourse.id}`, { replace: true });
      } else {
        // Update logic would go here
        toast({ title: "Updated", description: "Course update pending implementation (backend API)" });
      }
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to save course",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
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
              <Badge variant="outline" className="bg-white text-indigo-600 border-indigo-100 font-bold px-3 py-1 rounded-full uppercase text-[10px] tracking-wider">
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
                    onClick={() => navigate(`/courses/${course.slug}`)}
                >
                  <Eye className="mr-2 h-4 w-4" /> Preview
                </Button>
            )}
            <Button 
                className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-100 rounded-xl px-6 font-bold transition-all hover:-translate-y-0.5"
                onClick={handleSave}
                disabled={isSaving}
            >
              <Save className="mr-2 h-4 w-4" /> {isSaving ? "Saving..." : isCreationMode ? "Create Course" : "Save Changes"}
            </Button>
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
            >
              <BookOpen className="mr-2 h-4 w-4" /> Curriculum
            </TabsTrigger>
            <TabsTrigger 
              value="settings" 
              className="rounded-xl px-6 font-bold data-[state=active]:bg-white data-[state=active]:text-indigo-600 data-[state=active]:shadow-md transition-all h-full"
            >
              <Settings className="mr-2 h-4 w-4" /> Advanced Settings
            </TabsTrigger>
          </TabsList>

          <TabsContent value="general" className="mt-0">
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
                      <Label htmlFor="price" className="text-sm font-bold text-slate-700">Price (INR)</Label>
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">₹</span>
                        <Input 
                            id="price" 
                            type="number" 
                            value={course.price} 
                            onChange={(e) => setCourse({...course, price: parseFloat(e.target.value) || 0})}
                            className="pl-8 h-12 rounded-xl bg-white border-slate-100 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all"
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="rounded-3xl border-slate-100 shadow-sm overflow-hidden bg-white/50 backdrop-blur-xl h-fit">
                <CardHeader className="border-b border-slate-50 bg-white/50">
                  <CardTitle className="text-xl font-bold">Course Image</CardTitle>
                </CardHeader>
                <CardContent className="p-6 space-y-4">
                  <div className="aspect-video rounded-2xl overflow-hidden bg-slate-100 border-2 border-dashed border-slate-200 group relative">
                    <img 
                        src={course.thumbnail} 
                        alt="Preview" 
                        className="w-full h-full object-cover transition-opacity group-hover:opacity-50"
                    />
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button variant="secondary" size="sm" className="rounded-xl font-bold bg-white text-indigo-600 shadow-xl">
                            Change Image
                        </Button>
                    </div>
                  </div>
                  <p className="text-xs text-slate-400 text-center font-medium">
                    Recommended resolution: 1280x720px. Max size: 2MB.
                  </p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="curriculum" className="mt-0">
             <Card className="rounded-3xl border-slate-100 shadow-sm overflow-hidden bg-white/50 backdrop-blur-xl">
                <CardHeader className="border-b border-slate-50 bg-white/50 flex flex-row items-center justify-between space-y-0">
                  <div>
                    <CardTitle className="text-xl font-bold">Course Structure</CardTitle>
                    <CardDescription>Manage your course modules and content.</CardDescription>
                  </div>
                  <Button className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-md rounded-xl font-bold">
                    <Plus className="mr-2 h-4 w-4" /> Add Module
                  </Button>
                </CardHeader>
                <CardContent className="p-8 space-y-4">
                  {course.modules.length > 0 ? (
                    <div className="space-y-4">
                      {course.modules.map((module) => (
                        <div 
                          key={module.id} 
                          className="flex items-center gap-4 bg-white p-5 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all group"
                        >
                          <GripVertical className="h-5 w-5 text-slate-300 cursor-grab active:cursor-grabbing hover:text-indigo-400 transition-colors" />
                          <div className="flex-grow">
                            <h4 className="font-bold text-slate-800">Module {module.order}: {module.title}</h4>
                            <p className="text-xs text-slate-400 font-medium">3 lessons • 45 minutes</p>
                          </div>
                          <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button variant="ghost" size="icon" className="h-10 w-10 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl">
                              <ExternalLink className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-10 w-10 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
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
                       <Button variant="outline" className="rounded-xl border-slate-200 font-bold hover:text-indigo-600 group">
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
                  <Button variant="destructive" className="rounded-xl font-bold shadow-lg shadow-rose-200 min-w-[140px]">
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
