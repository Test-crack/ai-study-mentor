import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Course } from '@/features/courses/types';
import { coursesService } from '@/features/courses/services/coursesService';
import { StudentSidebar } from './dashboard/StudentSidebar';
import { StudentTopbar } from './dashboard/StudentTopbar';
import { Card, CardContent } from "@/shared/components/ui/card";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Badge } from "@/shared/components/ui/badge";
import { 
  Search, BookOpen, Clock, Loader2, PlayCircle, 
  BarChart, Calendar, MoreVertical, Filter, RefreshCw
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/shared/components/ui/dropdown-menu";

export default function StudentCoursesPage() {
  const navigate = useNavigate();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(true);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchCourses = async () => {
    setLoading(true);
    try {
      const response = await coursesService.getEnrolledCourses({ 
        page, 
        limit: 9,
        search: search || undefined
      });
      setCourses(response.data);
      if (response.pagination) {
        setTotalPages(response.pagination.totalPages);
      }
    } catch (error) {
      console.error('Failed to fetch courses', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCourses();
  }, [page, search]);

  /* Course Card Component */
  const EnrolledCourseCard = ({ course }: { course: Course }) => (
    <div 
      className="group relative bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
    >
      {/* Thumbnail */}
      <div className="relative aspect-video bg-slate-100 dark:bg-slate-800 overflow-hidden">
        {course.thumbnail ? (
          <img 
            src={course.thumbnail} 
            alt={course.title} 
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" 
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-slate-300 dark:text-slate-600">
            <BookOpen className="h-12 w-12" />
          </div>
        )}
        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <Button 
                onClick={() => navigate(`/learn/${course.slug}`)}
                className="rounded-full bg-white text-brand-teal-700 hover:bg-brand-teal-50"
            >
                <PlayCircle className="h-5 w-5 mr-2" /> Continue Learning
            </Button>
        </div>
        <div className="absolute top-3 right-3">
             <Badge className="bg-white/90 text-brand-teal-700 dark:bg-slate-900/90 dark:text-white backdrop-blur-sm shadow-sm">
                In Progress
             </Badge>
        </div>
      </div>

      {/* Content */}
      <div className="p-5 space-y-4">
        <div>
           <div className="flex justify-between items-start mb-2">
             <Badge variant="outline" className="text-xs border-brand-teal-200 text-brand-teal-600 dark:border-brand-teal-800 dark:text-brand-teal-400">
                {course.Domain?.name || 'General'}
             </Badge>
             <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-6 w-6 -mr-2 text-slate-400">
                        <MoreVertical className="h-4 w-4" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => navigate(`/courses/${course.slug}`)}>View Details</DropdownMenuItem>

                </DropdownMenuContent>
             </DropdownMenu>
           </div>
           <h3 className="font-bold text-lg text-slate-900 dark:text-white line-clamp-1 group-hover:text-brand-teal-600 dark:group-hover:text-brand-teal-400 transition-colors">
             {course.title}
           </h3>
           <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-2 mt-1">
             {course.description}
           </p>
        </div>

        {/* Progress Bar Placeholder */}
        <div className="space-y-2">
           <div className="flex justify-between text-xs font-medium text-slate-600 dark:text-slate-300">
             <span>Progress</span>
             <span>0%</span>
           </div>
           <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
             <div className="h-full bg-brand-teal-600 w-0 rounded-full"></div> 
           </div>
        </div>

        <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
           <div className="flex items-center gap-1">
             <Clock className="h-3.5 w-3.5" />
             <span>{Math.round(course.duration_minutes / 60)}h {course.duration_minutes % 60}m</span>
           </div>
           <div className="flex items-center gap-1">
             <BarChart className="h-3.5 w-3.5" />
             <span>{course.difficulty}</span>
           </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-slate-950 transition-colors duration-300">
      <StudentSidebar 
        activeTab="courses" 
        onTabChange={(tab) => {
             if (tab === 'dashboard') navigate('/student/dashboard');
             if (tab === 'settings') navigate('/student/settings');
             // other navs
        }}
        isCollapsed={isSidebarCollapsed}
        toggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
      />

      <div className={`transition-all duration-300 ${isSidebarCollapsed ? 'lg:pl-24' : 'lg:pl-72'}`}>
        <StudentTopbar onUpgradeClick={() => {}} />

        <main className="p-6 max-w-7xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 dark:text-white">My Learning</h1>
                    <p className="text-slate-500 dark:text-slate-400 mt-1">Track your progress and continue learning.</p>
                </div>
                <div className="flex items-center gap-2 w-full md:w-auto">
                    <div className="relative flex-1 md:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <Input 
                            placeholder="Search courses..." 
                            className="pl-9 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                    <Button 
                        variant="outline" 
                        size="icon" 
                        title="Reset Search"
                        onClick={() => { setSearch(''); setPage(1); }}
                        className="dark:bg-slate-900 dark:border-slate-800"
                    >
                        <RefreshCw className="h-4 w-4 text-slate-500" />
                    </Button>
                    <Button 
                        onClick={() => navigate('/courses')} 
                        className="bg-brand-teal-600 hover:bg-brand-teal-700 text-white hidden sm:flex"
                    >
                        Browse Courses
                    </Button>
                </div>
            </div>

            {/* Content Grid */}
            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="h-80 rounded-2xl bg-slate-100 dark:bg-slate-800 animate-pulse"></div>
                    ))}
                </div>
            ) : courses.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {courses.map(course => (
                        <EnrolledCourseCard key={course.id} course={course} />
                    ))}
                </div>
            ) : (
                <div className="text-center py-20">
                    <div className="inline-flex h-20 w-20 items-center justify-center rounded-full bg-brand-teal-50 dark:bg-brand-teal-900/20 mb-6">
                        <BookOpen className="h-10 w-10 text-brand-teal-600 dark:text-brand-teal-400" />
                    </div>
                    <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">No courses found</h2>
                    <p className="text-slate-500 dark:text-slate-400 max-w-sm mx-auto mb-6">
                        {search ? "We couldn't find any courses matching your search." : "You haven't enrolled in any courses yet. Start your learning journey today!"}
                    </p>
                    <Button onClick={() => navigate('/courses')} className="bg-brand-teal-600 text-white">
                        Browse Catalog
                    </Button>
                </div>
            )}

            {/* Pagination (Simple) */}
            {totalPages > 1 && (
                <div className="flex justify-center gap-2 pt-8">
                    <Button 
                        variant="outline" 
                        disabled={page === 1}
                        onClick={() => setPage(p => Math.max(1, p - 1))}
                    >
                        Previous
                    </Button>
                    <span className="flex items-center px-4 text-sm font-medium text-slate-600 dark:text-slate-400">
                        Page {page} of {totalPages}
                    </span>
                    <Button 
                        variant="outline" 
                        disabled={page === totalPages}
                        onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    >
                        Next
                    </Button>
                </div>
            )}

        </main>
      </div>
    </div>
  );
}
