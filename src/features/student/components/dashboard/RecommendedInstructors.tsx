import { Avatar, AvatarFallback, AvatarImage } from "@/shared/components/ui/avatar";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { ArrowRight } from "lucide-react";

export const RecommendedInstructors = () => {
  const instructors = [
    {
      id: 1,
      name: "Dr. Sarah Wilson",
      specialization: "Physics Expert",
      image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&auto=format&fit=crop&q=60",
    },
    {
      id: 2,
      name: "Prof. James Chen",
      specialization: "Mathematics",
      image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&auto=format&fit=crop&q=60",
    },
    {
      id: 3,
      name: "Emily Parker",
      specialization: "Literature",
      image: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&auto=format&fit=crop&q=60",
    }
  ];

  return (
    <Card className="border-none shadow-sm bg-white dark:bg-slate-900 rounded-2xl transition-colors">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-bold text-slate-800 dark:text-slate-100">Top Instructors</CardTitle>
          <Button variant="ghost" size="sm" className="text-brand-teal-600 dark:text-brand-teal-400 hover:text-brand-teal-700 hover:bg-brand-teal-50 dark:hover:bg-brand-teal-900/20 text-xs font-semibold">
            View All
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {instructors.map((instructor) => (
          <div key={instructor.id} className="flex items-center gap-3 p-2 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer group">
            <Avatar className="h-12 w-12 border-2 border-white dark:border-slate-700 shadow-sm">
              <AvatarImage src={instructor.image} />
              <AvatarFallback className="bg-slate-200 dark:bg-slate-700 w-full h-full flex items-center justify-center text-slate-500 dark:text-slate-300">{instructor.name[0]}</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <h4 className="font-semibold text-sm text-slate-900 dark:text-slate-100 truncate group-hover:text-brand-teal-700 dark:group-hover:text-brand-teal-400 transition-colors">
                {instructor.name}
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                {instructor.specialization}
              </p>
            </div>
            <Button size="icon" variant="ghost" className="h-8 w-8 text-slate-300 dark:text-slate-600 group-hover:text-brand-teal-600 dark:group-hover:text-brand-teal-400">
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        ))}
        <Button className="w-full bg-slate-900 dark:bg-slate-800 text-white hover:bg-slate-800 dark:hover:bg-slate-700 rounded-xl mt-2 transition-colors">
          Find a Tutor
        </Button>
      </CardContent>
    </Card>
  );
};
