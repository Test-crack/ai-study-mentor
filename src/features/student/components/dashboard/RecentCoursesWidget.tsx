import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/shared/components/ui/card";
import { Button } from "@/shared/components/ui/button";
import { ArrowRight, BookOpen, Clock, Loader2, PlayCircle } from "lucide-react";
import { useNavigate } from 'react-router-dom';
import { coursesService } from '@/features/courses/services/coursesService';
import { Course } from '@/features/courses/types';
import { Badge } from '@/shared/components/ui/badge';

export function RecentCoursesWidget() {
  const navigate = useNavigate();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const response = await coursesService.getEnrolledCourses({ limit: 3 });
        setCourses(response.data);
      } catch (error) {
        console.error('Failed to fetch enrolled courses', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCourses();
  }, []);

  if (loading) {
    return (
      <Card className="border-none shadow-sm bg-white dark:bg-slate-900 col-span-1 md:col-span-2 lg:col-span-3">
         <CardContent className="flex items-center justify-center p-12">
            <Loader2 className="h-8 w-8 text-indigo-600 animate-spin" />
         </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-none shadow-sm bg-white dark:bg-slate-900 col-span-1 md:col-span-2 lg:col-span-3 overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div className="space-y-1">
          <CardTitle className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-indigo-600" />
            My Recent Courses
          </CardTitle>
          <CardDescription className="dark:text-slate-400">Jump back into your learning journey.</CardDescription>
        </div>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => navigate('/student/courses')}
          className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 hover:bg-indigo-50 dark:hover:bg-indigo-900/20"
        >
          View All <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent>
        {courses.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {courses.map((course) => (
              <div 
                key={course.id} 
                className="group relative bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 border border-slate-100 dark:border-slate-800 hover:border-indigo-200 dark:hover:border-indigo-800 hover:shadow-md transition-all cursor-pointer"
                onClick={() => navigate(`/learn/${course.slug}`)}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-transparent to-white/5 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl pointer-events-none" />
                
                <div className="flex gap-4 items-start">
                  <div className="h-16 w-16 rounded-lg bg-indigo-100 dark:bg-slate-700 overflow-hidden flex-shrink-0">
                    {course.thumbnail ? (
                      <img src={course.thumbnail} alt={course.title} className="h-full w-full object-cover" />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                        <BookOpen className="h-8 w-8" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-slate-900 dark:text-white truncate pr-4">{course.title}</h4>
                    <div className="flex items-center gap-2 mt-1 text-xs text-slate-500 dark:text-slate-400">
                      <Clock className="h-3 w-3" />
                      <span>{Math.round(course.duration_minutes / 60)}h {course.duration_minutes % 60}m</span>
                    </div>
                    <div className="mt-3 flex items-center justify-between">
                       <Badge variant="secondary" className="text-xs bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300 border-none">
                         In Progress
                       </Badge>
                       <PlayCircle className="h-8 w-8 text-indigo-600 opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all duration-300" />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-10 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-dashed border-slate-200 dark:border-slate-700">
            <BookOpen className="h-10 w-10 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
            <h3 className="font-medium text-slate-900 dark:text-white">No courses yet</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-4 max-w-xs mx-auto">
              You haven't enrolled in any courses yet. Explore our catalog to get started!
            </p>
            <Button onClick={() => navigate('/courses')} className="bg-indigo-600 text-white">
              Browse Courses
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
