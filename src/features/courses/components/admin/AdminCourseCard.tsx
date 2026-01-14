import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/shared/components/ui/card";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/shared/components/ui/dropdown-menu";
import { MoreVertical, Edit, Eye, Trash2, Users, Clock, Star } from "lucide-react";

export interface AdminCourse {
  id: string;
  title: string;
  description: string;
  thumbnail?: string;
  students: number;
  rating: number;
  duration: string;
  price: number;
  status: 'published' | 'draft' | 'archived';
  lastUpdated: string;
}

interface AdminCourseCardProps {
  course: AdminCourse;
  onEdit: (id: string) => void;
  onView: (id: string) => void;
  onDelete: (id: string) => void;
}

export const AdminCourseCard = ({ course, onEdit, onView, onDelete }: AdminCourseCardProps) => {
  const statusColors = {
    published: "bg-green-100 text-green-700 hover:bg-green-100/80",
    draft: "bg-yellow-100 text-yellow-700 hover:bg-yellow-100/80",
    archived: "bg-gray-100 text-gray-700 hover:bg-gray-100/80",
  };

  return (
    <Card className="group overflow-hidden border-none shadow-md hover:shadow-2xl transition-all duration-300 flex flex-col h-full bg-white/50 backdrop-blur-sm hover:-translate-y-1">
      <div className="relative h-48 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent z-10" />
        <img 
          src={course.thumbnail || "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&auto=format&fit=crop&q=60"} 
          alt={course.title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
        />
        <div className="absolute top-4 right-4 z-20">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-white hover:bg-white/20 rounded-full backdrop-blur-md">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={() => onEdit(course.id)}>
                <Edit className="mr-2 h-4 w-4" /> Edit Details
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onView(course.id)}>
                <Eye className="mr-2 h-4 w-4" /> Preview Course
              </DropdownMenuItem>
              <DropdownMenuItem className="text-red-600 focus:text-red-600" onClick={() => onDelete(course.id)}>
                <Trash2 className="mr-2 h-4 w-4" /> Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <div className="absolute top-4 left-4 z-20">
            <Badge className={`${statusColors[course.status]} border-none shadow-sm`}>
                {course.status.charAt(0).toUpperCase() + course.status.slice(1)}
            </Badge>
        </div>
        <div className="absolute bottom-4 left-4 right-4 z-20 text-white">
            <h3 className="font-bold text-lg leading-tight mb-1 line-clamp-2">{course.title}</h3>
            <div className="flex items-center text-xs text-white/80 space-x-3">
                <span className="flex items-center"><Users className="h-3 w-3 mr-1" /> {course.students}</span>
                <span className="flex items-center"><Star className="h-3 w-3 mr-1 text-yellow-400" /> {course.rating}</span>
            </div>
        </div>
      </div>
      
      <CardContent className="flex-grow p-4 space-y-3">
        <p className="text-sm text-muted-foreground line-clamp-2">
            {course.description}
        </p>
        <div className="flex items-center justify-between text-xs text-muted-foreground pt-2">
            <span className="flex items-center bg-secondary/50 px-2 py-1 rounded-md">
                <Clock className="w-3 h-3 mr-1" /> {course.duration}
            </span>
            <span className="font-semibold text-primary text-sm">
                ${course.price}
            </span>
        </div>
      </CardContent>

      <CardFooter className="p-4 pt-0">
        <Button 
            onClick={() => onEdit(course.id)}
            className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-md hover:shadow-lg transition-all"
        >
            Manage Course
        </Button>
      </CardFooter>
    </Card>
  );
};
