import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/shared/components/ui/tabs";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/shared/components/ui/dropdown-menu";
import { Plus, Search, Filter, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState, useMemo } from "react";
import { AdminNavbar } from "./AdminNavbar";
import { AdminStats } from "./AdminStats";
import { AdminCourseCard } from "./AdminCourseCard";
import { useInstructorCourses } from "../../hooks/useInstructorCourses";
import { useDebounce } from "../../../../shared/hooks/useDebounce";
import { Skeleton } from "@/shared/components/ui/skeleton";
import { CreateCourseDialog } from "./CreateCourseDialog";

const AdminDashboardPage = () => {
  const navigate = useNavigate();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearch = useDebounce(searchQuery, 500);
  const [activeTab, setActiveTab] = useState("all");
  const [sortConfig, setSortConfig] = useState<{ sortBy: string; sortOrder: 'asc' | 'desc' }>({
    sortBy: 'created_at',
    sortOrder: 'desc'
  });

  const filters = useMemo(() => {
    return {
      search: debouncedSearch,
      is_published: activeTab === "all" ? undefined : activeTab === "published",
      sortBy: sortConfig.sortBy,
      sortOrder: sortConfig.sortOrder
    };
  }, [debouncedSearch, activeTab, sortConfig]);

  const { data: response, isLoading } = useInstructorCourses(filters);
  const courses = response?.data || [];

  const handleEdit = (id: string) => {
    navigate(`/courses/admin/manage/${id}`);
  };

  const handleView = (idOrSlug: string) => {
    navigate(`/courses/${idOrSlug}`);
  };

  const handleDelete = (id: string) => {
    console.log("Course would be deleted:", id);
    // In a real app, this would be an API call followed by a state update or refetch
  };

  return (
    <div className="min-h-screen bg-[#f8fafc]">
      <div className="fixed inset-0 bg-gradient-to-tr from-indigo-50/20 via-white to-purple-50/20 pointer-events-none" />
      
      <AdminNavbar />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10 relative z-10">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1">
            <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">
              Instructor Dashboard
            </h1>
            <p className="text-slate-500 font-medium text-lg">
              Empower your students with world-class content and insights.
            </p>
          </div>
            <Button 
            size="lg" 
            className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-xl shadow-indigo-200 h-14 px-8 rounded-2xl font-bold text-base transition-all hover:-translate-y-1 active:translate-y-0 active:shadow-md"
            onClick={() => setIsDialogOpen(true)}
          >
            <Plus className="mr-2 h-5 w-5 stroke-[3px]" /> Create New Course
          </Button>
        </div>

        {/* Stats Section */}
        <AdminStats />

        <CreateCourseDialog open={isDialogOpen} onOpenChange={setIsDialogOpen} />

        {/* Courses Management Section */}
        <div className="space-y-8">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-6 bg-white p-5 rounded-2xl border border-slate-100 shadow-sm shadow-slate-200/50 backdrop-blur-sm">
            <div className="flex flex-col sm:flex-row items-center gap-4 w-full lg:w-auto">
                <div className="flex items-center space-x-2">
                    <h2 className="text-xl font-bold text-slate-800 whitespace-nowrap">My Courses</h2>
                    <span className="bg-slate-100 text-slate-600 text-xs font-bold px-2.5 py-1 rounded-full">{response?.meta?.total || 0}</span>
                </div>
                
                <div className="h-8 w-px bg-slate-100 hidden sm:block"></div>

                <div className="flex items-center space-x-3 w-full sm:w-auto">
                    <div className="relative w-full sm:w-72 group">
                        <Search className="absolute left-3.5 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                        <Input 
                            placeholder="Search projects..." 
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-11 h-11 bg-slate-50/50 border-slate-100 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 rounded-xl text-sm font-medium transition-all"
                        />
                    </div>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-11 w-11 rounded-xl bg-slate-50/50 border border-slate-100 text-slate-500 hover:bg-white hover:text-indigo-600 transition-all">
                                <Filter className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-56 p-2 rounded-2xl shadow-2xl border-slate-100">
                            <div className="px-3 py-2 text-xs font-bold text-slate-400 uppercase tracking-wider">Sort By</div>
                            <DropdownMenuItem 
                                onClick={() => setSortConfig({ sortBy: 'created_at', sortOrder: 'desc' })}
                                className={`rounded-xl px-3 py-2.5 font-medium transition-colors ${sortConfig.sortBy === 'created_at' && sortConfig.sortOrder === 'desc' ? 'bg-indigo-50 text-indigo-600' : 'focus:bg-indigo-50 focus:text-indigo-600'}`}
                            >
                                Newest First
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                                onClick={() => setSortConfig({ sortBy: 'created_at', sortOrder: 'asc' })}
                                className={`rounded-xl px-3 py-2.5 font-medium transition-colors ${sortConfig.sortBy === 'created_at' && sortConfig.sortOrder === 'asc' ? 'bg-indigo-50 text-indigo-600' : 'focus:bg-indigo-50 focus:text-indigo-600'}`}
                            >
                                Oldest First
                            </DropdownMenuItem>
                            <div className="h-px bg-slate-100 my-1 mx-1" />
                            <DropdownMenuItem 
                                onClick={() => setSortConfig({ sortBy: 'price', sortOrder: 'asc' })}
                                className={`rounded-xl px-3 py-2.5 font-medium transition-colors ${sortConfig.sortBy === 'price' && sortConfig.sortOrder === 'asc' ? 'bg-indigo-50 text-indigo-600' : 'focus:bg-indigo-50 focus:text-indigo-600'}`}
                            >
                                Price: Low to High
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                                onClick={() => setSortConfig({ sortBy: 'price', sortOrder: 'desc' })}
                                className={`rounded-xl px-3 py-2.5 font-medium transition-colors ${sortConfig.sortBy === 'price' && sortConfig.sortOrder === 'desc' ? 'bg-indigo-50 text-indigo-600' : 'focus:bg-indigo-50 focus:text-indigo-600'}`}
                            >
                                Price: High to Low
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>
            
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full lg:w-auto">
              <TabsList className="grid w-full grid-cols-3 lg:w-[320px] h-11 p-1 bg-slate-100/50 rounded-xl border border-slate-100">
                <TabsTrigger value="all" className="rounded-lg text-xs font-bold data-[state=active]:bg-white data-[state=active]:text-indigo-600 data-[state=active]:shadow-sm">All</TabsTrigger>
                <TabsTrigger value="published" className="rounded-lg text-xs font-bold data-[state=active]:bg-white data-[state=active]:text-indigo-600 data-[state=active]:shadow-sm">Published</TabsTrigger>
                <TabsTrigger value="draft" className="rounded-lg text-xs font-bold data-[state=active]:bg-white data-[state=active]:text-indigo-600 data-[state=active]:shadow-sm">Drafts</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {isLoading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-[400px] w-full rounded-3xl bg-white border border-slate-100 p-6 space-y-6">
                  <Skeleton className="h-48 w-full rounded-2xl" />
                  <Skeleton className="h-8 w-3/4 rounded-lg" />
                  <Skeleton className="h-4 w-full rounded-lg" />
                  <div className="pt-6 border-t border-slate-50 grid grid-cols-2 gap-4">
                    <Skeleton className="h-4 w-full rounded-lg" />
                    <Skeleton className="h-4 w-full rounded-lg" />
                  </div>
                </div>
              ))
            ) : courses.length > 0 ? (
              courses.map((course: any) => (
                <div key={course.id}>
                  <AdminCourseCard 
                    course={{
                        ...course,
                        status: course.is_published ? 'published' : 'draft',
                        students: course._count?.UserCourseEnrollment || 0,
                        rating: 4.8, // Mocked as not in schema for now
                        duration: `${course.duration_minutes || 0}`,
                        lastUpdated: new Date(course.created_at).toLocaleDateString(),
                        thumbnail: "https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=800&auto=format&fit=crop&q=60" // Mocked
                    }}
                    onEdit={handleEdit}
                    onView={(id) => handleView(course.slug)}
                    onDelete={handleDelete}
                  />
                </div>
              ))
            ) : (
                <div className="col-span-full py-20 text-center space-y-4 bg-white rounded-3xl border border-slate-100">
                    <div className="h-20 w-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto">
                        <Sparkles className="h-10 w-10 text-slate-200" />
                    </div>
                    <div>
                        <h3 className="text-xl font-bold text-slate-800">No courses found</h3>
                        <p className="text-slate-500 font-medium">Try adjusting your filters or search query.</p>
                    </div>
                </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default AdminDashboardPage;
