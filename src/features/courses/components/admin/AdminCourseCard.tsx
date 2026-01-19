import { 
  MoreVertical, 
  Users, 
  Star, 
  Clock, 
  Eye, 
  Edit3, 
  Trash2,
  Calendar
} from "lucide-react";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/shared/components/ui/dropdown-menu";
import { Button } from "@/shared/components/ui/button";
import { Badge } from "@/shared/components/ui/badge";

export interface AdminCourse {
  id: string;
  title: string;
  description: string;
  students: number;
  rating: number;
  duration: string;
  price: number;
  status: 'published' | 'draft';
  lastUpdated: string;
  thumbnail: string;
}

interface AdminCourseCardProps {
  course: AdminCourse;
  onEdit: (id: string) => void;
  onView: (id: string) => void;
  onDelete: (id: string) => void;
}

export const AdminCourseCard = ({ course, onEdit, onView, onDelete }: AdminCourseCardProps) => {
  return (
    <div className="group bg-white rounded-3xl border border-slate-100 shadow-sm hover:shadow-2xl hover:shadow-indigo-500/10 transition-all duration-300 overflow-hidden flex flex-col h-full border-b-4 border-b-transparent hover:border-b-indigo-500">
      {/* Thumbnail Container */}
      <div className="relative aspect-video overflow-hidden">
        <img 
          src={course.thumbnail} 
          alt={course.title}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        
        {/* Badges */}
        <div className="absolute top-4 left-4 flex gap-2">
          <Badge className={`px-3 py-1 rounded-full border-none font-bold text-[10px] uppercase tracking-wider ${
            course.status === 'published' 
              ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30' 
              : 'bg-amber-500 text-white shadow-lg shadow-amber-500/30'
          }`}>
            {course.status}
          </Badge>
        </div>

        {/* Floating Actions */}
        <div className="absolute top-4 right-4 translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-500">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="icon" variant="secondary" className="h-9 w-9 rounded-xl bg-white/90 backdrop-blur-sm shadow-xl hover:bg-white text-slate-700">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48 p-2 rounded-2xl shadow-2xl border-slate-100">
              <DropdownMenuItem onClick={() => onView(course.id)} className="rounded-xl px-3 py-2.5 focus:bg-indigo-50 focus:text-indigo-600 font-medium transition-colors">
                <Eye className="mr-2 h-4 w-4" /> Preview
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onEdit(course.id)} className="rounded-xl px-3 py-2.5 focus:bg-indigo-50 focus:text-indigo-600 font-medium transition-colors">
                <Edit3 className="mr-2 h-4 w-4" /> Edit Course
              </DropdownMenuItem>
              <div className="h-px bg-slate-100 my-1 mx-1" />
              <DropdownMenuItem 
                onClick={() => onDelete(course.id)} 
                className="rounded-xl px-3 py-2.5 focus:bg-rose-50 focus:text-rose-600 font-medium transition-colors text-rose-500"
              >
                <Trash2 className="mr-2 h-4 w-4" /> Delete Course
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Content */}
      <div className="p-6 flex flex-col flex-grow">
        <h3 className="text-xl font-bold text-slate-900 leading-tight group-hover:text-indigo-600 transition-colors line-clamp-2 min-h-[3.5rem]">
          {course.title}
        </h3>
        
        <p className="mt-3 text-slate-500 text-sm leading-relaxed line-clamp-2">
          {course.description}
        </p>

        <div className="mt-6 pt-6 border-t border-slate-50 grid grid-cols-2 gap-4">
          <div className="flex items-center space-x-2 text-slate-400">
            <Users className="h-4 w-4 text-indigo-400" />
            <span className="text-xs font-bold text-slate-600">{course.students.toLocaleString()} students</span>
          </div>
          <div className="flex items-center space-x-2 text-slate-400">
            <Star className="h-4 w-4 text-amber-400 fill-amber-400" />
            <span className="text-xs font-bold text-slate-600">{course.rating} Avg Rating</span>
          </div>
          <div className="flex items-center space-x-2 text-slate-400">
            <Clock className="h-4 w-4 text-blue-400" />
            <span className="text-xs font-bold text-slate-600">{course.duration}</span>
          </div>
          <div className="flex items-center space-x-2 text-slate-400">
            <Calendar className="h-4 w-4 text-purple-400" />
            <span className="text-xs font-bold text-slate-600">{course.lastUpdated}</span>
          </div>
        </div>
      </div>

      {/* Footer / Price */}
      <div className="px-6 pb-6 mt-auto">
        <div className="flex items-center justify-between">
            <div className="text-2xl font-bold text-slate-900">
                ${course.price}
            </div>
            <Button 
                variant="ghost" 
                size="sm" 
                className="text-indigo-600 font-bold hover:bg-indigo-50 hover:text-indigo-700 rounded-xl px-4"
                onClick={() => onEdit(course.id)}
            >
                Management →
            </Button>
        </div>
      </div>
    </div>
  );
};
