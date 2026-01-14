import { useState } from "react";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/components/ui/tabs";
import { Plus, Search, Filter, LayoutGrid, List } from "lucide-react";
import { Navbar } from "@/shared/components/layout/Navbar";
import { AdminStats } from "./AdminStats";
import { AdminCourseCard, AdminCourse } from "./AdminCourseCard";

const AdminDashboardPage = () => {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-zinc-100">
      <Navbar showNavItems activeTab="admin" />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 animate-in fade-in slide-in-from-top-4 duration-500">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
              Instructor Dashboard
            </h1>
            <p className="text-muted-foreground mt-1">
              Manage your courses, analyze performance, and create new content.
            </p>
          </div>
          <Button 
            size="lg" 
            className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all"
          >
            <Plus className="mr-2 h-5 w-5" /> Create New Course
          </Button>
        </div>

        {/* Stats Section */}
        <AdminStats />

        {/* Courses Management Section */}
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white/50 p-4 rounded-xl border border-gray-100 shadow-sm backdrop-blur-sm">
            <div className="flex items-center space-x-2 w-full sm:w-auto">
              <div className="relative w-full sm:w-72">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder="Search your courses..." 
                  className="pl-10 bg-white/80 border-gray-200 focus:border-indigo-500 focus:ring-indigo-500"
                />
              </div>
              <Button variant="outline" size="icon" className="shrink-0">
                <Filter className="h-4 w-4" />
              </Button>
            </div>
            
            <Tabs defaultValue="all" className="w-full sm:w-auto">
              <TabsList className="grid w-full grid-cols-3 sm:w-[300px]">
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="published">Published</TabsTrigger>
                <TabsTrigger value="draft">Drafts</TabsTrigger>
              </TabsList>
            </Tabs>

            <div className="hidden sm:flex border rounded-lg bg-white/50 p-1">
              <Button 
                variant={viewMode === 'grid' ? 'secondary' : 'ghost'} 
                size="sm" 
                className="px-2"
                onClick={() => setViewMode('grid')}
              >
                <LayoutGrid className="h-4 w-4" />
              </Button>
              <Button 
                variant={viewMode === 'list' ? 'secondary' : 'ghost'} 
                size="sm" 
                className="px-2"
                onClick={() => setViewMode('list')}
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {mockCourses.map((course, index) => (
              <div 
                key={course.id} 
                className="animate-in fade-in slide-in-from-bottom-4 duration-500 fill-mode-backwards"
                style={{ animationDelay: `${index * 100}ms` }}
              >
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
