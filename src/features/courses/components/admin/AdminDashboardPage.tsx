import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/shared/components/ui/tabs";
import { Plus, Search, Filter, Sparkles } from "lucide-react";
import { AdminNavbar } from "./AdminNavbar";
import { AdminStats } from "./AdminStats";
import { AdminCourseCard, AdminCourse } from "./AdminCourseCard";

const AdminDashboardPage = () => {
  // Mock Data
  const mockCourses: AdminCourse[] = [
    {
      id: "1",
      title: "Advanced React Patterns & Performance",
      description: "Master advanced React concepts including HOCs, Render Props, and Custom Hooks for building scalable applications.",
      students: 1234,
      rating: 4.8,
      duration: "12h 30m",
      price: 99.99,
      status: "published",
      lastUpdated: "2 days ago",
      thumbnail: "https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=800&auto=format&fit=crop&q=60"
    },
    {
      id: "2",
      title: "UI/UX Design Masterclass 2024",
      description: "Complete guide to modern UI/UX design principles, tools, and workflows used by top designers.",
      students: 856,
      rating: 4.9,
      duration: "24h 15m",
      price: 149.99,
      status: "published",
      lastUpdated: "1 week ago",
      thumbnail: "https://images.unsplash.com/photo-1586717791821-3f44a5638d0f?w=800&auto=format&fit=crop&q=60"
    },
    {
      id: "3",
      title: "Fullstack Web Development Bootcamp",
      description: "Become a full-stack developer with this comprehensive guide covering Node.js, React, and PostgreSQL.",
      students: 45,
      rating: 4.5,
      duration: "48h 00m",
      price: 199.99,
      status: "draft",
      lastUpdated: "3 hours ago",
      thumbnail: "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=800&auto=format&fit=crop&q=60"
    },
    {
      id: "4",
      title: "Python for Data Science",
      description: "Learn how to use Python for data analysis, machine learning, and visualization.",
      students: 0,
      rating: 0,
      duration: "18h 45m",
      price: 89.99,
      status: "draft",
      lastUpdated: "1 day ago",
      thumbnail: "https://images.unsplash.com/photo-1526379095098-d400fd0bf935?w=800&auto=format&fit=crop&q=60"
    }
  ];

  const handleEdit = (id: string) => {
    console.log("Edit course", id);
  };

  const handleView = (id: string) => {
    console.log("View course", id);
  };

  const handleDelete = (id: string) => {
    console.log("Delete course", id);
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
          >
            <Plus className="mr-2 h-5 w-5 stroke-[3px]" /> Create New Course
          </Button>
        </div>

        {/* Stats Section */}
        <AdminStats />

        {/* Courses Management Section */}
        <div className="space-y-8">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-6 bg-white p-5 rounded-2xl border border-slate-100 shadow-sm shadow-slate-200/50 backdrop-blur-sm">
            <div className="flex flex-col sm:flex-row items-center gap-4 w-full lg:w-auto">
                <div className="flex items-center space-x-2">
                    <h2 className="text-xl font-bold text-slate-800 whitespace-nowrap">My Courses</h2>
                    <span className="bg-slate-100 text-slate-600 text-xs font-bold px-2.5 py-1 rounded-full">{mockCourses.length}</span>
                </div>
                
                <div className="h-8 w-px bg-slate-100 hidden sm:block"></div>

                <div className="flex items-center space-x-3 w-full sm:w-auto">
                    <div className="relative w-full sm:w-72 group">
                        <Search className="absolute left-3.5 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                        <Input 
                            placeholder="Search projects..." 
                            className="pl-11 h-11 bg-slate-50/50 border-slate-100 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 rounded-xl text-sm font-medium transition-all"
                        />
                    </div>
                    <Button variant="ghost" size="icon" className="h-11 w-11 rounded-xl bg-slate-50/50 border border-slate-100 text-slate-500 hover:bg-white hover:text-indigo-600 transition-all">
                        <Filter className="h-4 w-4" />
                    </Button>
                </div>
            </div>
            
            <Tabs defaultValue="all" className="w-full lg:w-auto">
              <TabsList className="grid w-full grid-cols-3 lg:w-[320px] h-11 p-1 bg-slate-100/50 rounded-xl border border-slate-100">
                <TabsTrigger value="all" className="rounded-lg text-xs font-bold data-[state=active]:bg-white data-[state=active]:text-indigo-600 data-[state=active]:shadow-sm">All</TabsTrigger>
                <TabsTrigger value="published" className="rounded-lg text-xs font-bold data-[state=active]:bg-white data-[state=active]:text-indigo-600 data-[state=active]:shadow-sm">Published</TabsTrigger>
                <TabsTrigger value="draft" className="rounded-lg text-xs font-bold data-[state=active]:bg-white data-[state=active]:text-indigo-600 data-[state=active]:shadow-sm">Drafts</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {mockCourses.map((course) => (
              <div key={course.id}>
                <AdminCourseCard 
                  course={course}
                  onEdit={handleEdit}
                  onView={handleView}
                  onDelete={handleDelete}
                />
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
};

export default AdminDashboardPage;
